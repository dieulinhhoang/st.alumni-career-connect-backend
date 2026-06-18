import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SurveysService } from './surveys.service';
import { Survey } from '../database/entities/survey.entity';
import { SurveySection } from '../database/entities/survey-section.entity';
import { SurveyQuestion } from '../database/entities/survey-question.entity';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';

function makeSurvey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: 1,
    title: 'Khảo sát việc làm',
    description: 'Mô tả',
    status: 'draft',
    themeConfig: null,
    settings: {},
    sections: [],
    questions: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  } as unknown as Survey;
}

function makeQuestion(overrides: Partial<SurveyQuestion> = {}): SurveyQuestion {
  return {
    id: 10,
    surveyId: 1,
    questionKey: 'q1',
    questionText: 'Câu hỏi?',
    questionType: 'radio',
    sectionKey: 'sec1',
    options: [{ id: 'o1', label: 'A' }],
    isRequired: 1,
    orderIndex: 1,
    visibleWhen: null,
    reportFieldKey: null,
    showInChart: 0,
    chartType: null,
    reportTemplate: null,
    excelColumn: null,
    settings: null,
    ...overrides,
  } as unknown as SurveyQuestion;
}

describe('SurveysService', () => {
  let service: SurveysService;
  let surveyRepo: {
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let questionRepo: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let alumniBatchRepo: {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    surveyRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    questionRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    alumniBatchRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      })),
    };

    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveysService,
        { provide: getRepositoryToken(Survey), useValue: surveyRepo },
        { provide: getRepositoryToken(SurveySection), useValue: {} },
        { provide: getRepositoryToken(SurveyQuestion), useValue: questionRepo },
        { provide: getRepositoryToken(AlumniBatch), useValue: alumniBatchRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<SurveysService>(SurveysService);
  });

  //  mapToForm 

  describe('mapToForm', () => {
    it('ánh xạ survey sang cấu trúc form frontend', () => {
      const q = makeQuestion();
      const survey = makeSurvey({
        settings: { sections: [{ id: 'sec1', title: 'Phần 1' }] } as any,
        questions: [q],
      });

      const form = service.mapToForm(survey, true);

      expect(form.id).toBe(1);
      expect(form.name).toBe('Khảo sát việc làm');
      expect(form.usedInBatch).toBe(true);
      expect(form.questions).toHaveLength(1);
      expect(form.questions[0].id).toBe('q1');
      expect(form.questions[0].type).toBe('radio');
      expect(form.questions[0].required).toBe(true);
      expect(form.questions[0].sectionId).toBe('sec1');
    });

    it('usedInBatch mặc định là false', () => {
      const form = service.mapToForm(makeSurvey());
      expect(form.usedInBatch).toBe(false);
    });

    it('isSystem = true khi settings.isSystem = true', () => {
      const survey = makeSurvey({ settings: { isSystem: true } as any });
      const form = service.mapToForm(survey);
      expect(form.isSystem).toBe(true);
    });

    it('questions rỗng khi survey không có câu hỏi', () => {
      const form = service.mapToForm(makeSurvey({ questions: [] }));
      expect(form.questions).toHaveLength(0);
    });

    it('themeConfig được ánh xạ đúng', () => {
      const survey = makeSurvey({
        themeConfig: { themeId: 'blue', header: 'Header', footer: 'Footer' } as any,
      });
      const form = service.mapToForm(survey);
      expect(form.themeId).toBe('blue');
      expect(form.header).toBe('Header');
      expect(form.footer).toBe('Footer');
    });
  });

  //  findOne 

  describe('findOne', () => {
    it('trả survey khi tìm thấy', async () => {
      const survey = makeSurvey();
      surveyRepo.findOne.mockResolvedValue(survey);

      const result = await service.findOne(1);
      expect(result).toEqual(survey);
    });

    it('ném NotFoundException khi không tìm thấy', async () => {
      surveyRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  //  remove 

  describe('remove', () => {
    it('gọi softDelete khi hợp lệ', async () => {
      surveyRepo.findOne.mockResolvedValue(makeSurvey());
      surveyRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(surveyRepo.softDelete).toHaveBeenCalledWith(1);
    });

    it('ném BadRequestException khi form là system', async () => {
      surveyRepo.findOne.mockResolvedValue(makeSurvey({ settings: { isSystem: true } as any }));

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi form đang được dùng trong batch', async () => {
      surveyRepo.findOne.mockResolvedValue(makeSurvey());
      alumniBatchRepo.count.mockResolvedValue(1);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  //  Question Bank 

  describe('getQuestionBank', () => {
    it('trả toàn bộ câu hỏi khi không có filter', async () => {
      const result = await service.getQuestionBank();
      expect(result.length).toBeGreaterThan(0);
    });

    it('lọc theo search keyword (không phân biệt hoa thường)', async () => {
      const result = await service.getQuestionBank({ search: 'việc làm' });
      expect(result.every((q) => q.title.toLowerCase().includes('việc làm') || q.category.toLowerCase().includes('việc làm'))).toBe(true);
    });

    it('lọc theo category', async () => {
      const result = await service.getQuestionBank({ category: 'Thu nhập' });
      expect(result.every((q) => q.category === 'Thu nhập')).toBe(true);
    });

    it('trả mảng rỗng khi không khớp filter', async () => {
      const result = await service.getQuestionBank({ search: 'xyz_không_tồn_tại' });
      expect(result).toHaveLength(0);
    });
  });

  describe('createBankQuestion', () => {
    it('thêm câu hỏi mới vào bank', async () => {
      const before = (await service.getQuestionBank()).length;
      const newQ = await service.createBankQuestion({ title: 'Câu mới', type: 'text', category: 'Test' });

      expect(newQ.id).toBeDefined();
      expect(newQ.title).toBe('Câu mới');
      expect(newQ.category).toBe('Test');

      const after = (await service.getQuestionBank()).length;
      expect(after).toBe(before + 1);
    });

    it('dùng "Khác" làm category mặc định', async () => {
      const newQ = await service.createBankQuestion({ title: 'Câu khác', type: 'text' });
      expect(newQ.category).toBe('Khác');
    });
  });

  describe('removeBankQuestion', () => {
    it('xóa câu hỏi khỏi bank theo id', async () => {
      const newQ = await service.createBankQuestion({ title: 'Sẽ bị xóa', type: 'text' });
      const before = (await service.getQuestionBank()).length;

      await service.removeBankQuestion(newQ.id);

      const after = (await service.getQuestionBank()).length;
      expect(after).toBe(before - 1);
      const ids = (await service.getQuestionBank()).map((q) => q.id);
      expect(ids).not.toContain(newQ.id);
    });

    it('không ném lỗi khi xóa id không tồn tại', async () => {
      await expect(service.removeBankQuestion('nonexistent')).resolves.toBeUndefined();
    });
  });

  //  generateWithAI 

  describe('generateWithAI', () => {
    it('trả form draft với tên chứa prompt', async () => {
      const result = await service.generateWithAI('khảo sát nghề nghiệp');

      expect(result.name).toContain('khảo sát nghề nghiệp');
      expect(Array.isArray(result.sections)).toBe(true);
      expect(Array.isArray(result.questions)).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
    });
  });

  //  normalizeQuestionType (private, accessed directly) 

  describe('normalizeQuestionType', () => {
    const svc = () => service as any;

    const cases: [string, string][] = [
      ['text', 'text'],
      ['textarea', 'textarea'],
      ['radio', 'radio'],
      ['checkbox', 'checkbox'],
      ['select', 'select'],
      ['single_choice', 'radio'],
      ['multiple_choice', 'checkbox'],
      ['short', 'text'],
      ['long', 'textarea'],
      ['dropdown', 'select'],
      ['email', 'text'],
      ['tel', 'text'],
      ['address', 'address'],
      ['cccd', 'cccd'],
      ['unknown_type', 'text'],
    ];

    test.each(cases)('"%s" → "%s"', (input, expected) => {
      expect(svc().normalizeQuestionType(input)).toBe(expected);
    });
  });

  //  normalizeChartType (private, accessed directly) 

  describe('normalizeChartType', () => {
    const svc = () => service as any;

    it('"pie" → "pie"', () => expect(svc().normalizeChartType('pie')).toBe('pie'));
    it('"column" → "column"', () => expect(svc().normalizeChartType('column')).toBe('column'));
    it('"bar" → "column"', () => expect(svc().normalizeChartType('bar')).toBe('column'));
    it('null → null', () => expect(svc().normalizeChartType(null)).toBeNull());
    it('undefined → null', () => expect(svc().normalizeChartType(undefined)).toBeNull());
    it('chuỗi lạ → null', () => expect(svc().normalizeChartType('unknown')).toBeNull());
  });
});
