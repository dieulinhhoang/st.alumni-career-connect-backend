import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Survey } from '../database/entities/survey.entity';
import { SurveySection } from '../database/entities/survey-section.entity';
import { SurveyQuestion } from '../database/entities/survey-question.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { GetFormsQueryDto } from './dto/get-forms-query.dto';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveySection)
    private readonly sectionRepo: Repository<SurveySection>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepo: Repository<SurveyQuestion>,
  ) {}

  async create(dto: CreateSurveyDto): Promise<Survey> {
    const survey = this.surveyRepo.create({
      title: dto.name,
      description: dto.description,
      themeConfig: {
        themeId: dto.themeId ?? null,
        header: dto.header ?? null,
        footer: dto.footer ?? null,
      },
      settings: { sections: dto.sections ?? [] },
      status: 'draft',
    });
    const saved = await this.surveyRepo.save(survey);

    if (dto.questions?.length) {
      const questions = dto.questions.map((q) =>
        this.questionRepo.create({
          survey: saved,
          questionText: q.title,
          questionType: q.type as any,
          options: q.options ? JSON.stringify(q.options) : null,
          isRequired: q.required,
          orderIndex: q.order,
          settings: {
            id: q.id,
            sectionId: q.sectionId,
            placeholder: q.placeholder,
            visibleWhen: q.visibleWhen,
            reportFieldKey: q.reportFieldKey,
            showInChart: q.showInChart,
            chartType: q.chartType,
            reportTemplate: q.reportTemplate,
            excelColumn: q.excelColumn,
          },
        }),
      );
      await this.questionRepo.save(questions);
    }

    return this.findOne(saved.id);
  }

  async findAll(query: GetFormsQueryDto) {
    const { search, page = 1, pageSize = 10 } = query;
    const where = search ? { title: Like(`%${search}%`) } : {};
    const [data, total] = await this.surveyRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['sections', 'questions'],
    });
    return { data: data.map((s) => this.mapToForm(s)), total, page, pageSize };
  }

  async findOne(id: number): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { id },
      relations: ['sections', 'questions'],
    });
    if (!survey) throw new NotFoundException(`Form #${id} không tìm thấy`);
    return survey;
  }

  async update(id: number, dto: UpdateSurveyDto): Promise<any> {
    const survey = await this.findOne(id);

    if (dto.name) survey.title = dto.name;
    if (dto.description !== undefined) survey.description = dto.description;
    if (dto.themeId !== undefined || dto.header !== undefined || dto.footer !== undefined) {
      survey.themeConfig = {
        ...survey.themeConfig,
        themeId: dto.themeId ?? survey.themeConfig?.themeId,
        header: dto.header ?? survey.themeConfig?.header,
        footer: dto.footer ?? survey.themeConfig?.footer,
      };
    }
    if (dto.sections !== undefined) {
      survey.settings = { ...survey.settings, sections: dto.sections };
    }

    await this.surveyRepo.save(survey);

    if (dto.questions !== undefined) {
      await this.questionRepo.delete({ survey: { id } });
      const questions = dto.questions.map((q) =>
        this.questionRepo.create({
          survey,
          questionText: q.title,
          questionType: q.type as any,
          options: q.options ? JSON.stringify(q.options) : null,
          isRequired: q.required,
          orderIndex: q.order,
          settings: {
            id: q.id,
            sectionId: q.sectionId,
            placeholder: q.placeholder,
            visibleWhen: q.visibleWhen,
            reportFieldKey: q.reportFieldKey,
            showInChart: q.showInChart,
            chartType: q.chartType,
            reportTemplate: q.reportTemplate,
            excelColumn: q.excelColumn,
          },
        }),
      );
      await this.questionRepo.save(questions);
    }

    return this.mapToForm(await this.findOne(id));
  }

  async remove(id: number): Promise<void> {
    const survey = await this.findOne(id);
    await this.surveyRepo.softDelete(survey.id);
  }

  async duplicate(id: number): Promise<any> {
    const original = await this.findOne(id);
    const copy = this.surveyRepo.create({
      title: `${original.title} (Bản sao)`,
      description: original.description,
      themeConfig: original.themeConfig,
      settings: original.settings,
      status: 'draft',
    });
    const saved = await this.surveyRepo.save(copy);

    if (original.questions?.length) {
      const questions = original.questions.map((q) =>
        this.questionRepo.create({
          survey: saved,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          settings: q.settings,
        }),
      );
      await this.questionRepo.save(questions);
    }
    return this.mapToForm(await this.findOne(saved.id));
  }

  async generateWithAI(prompt: string): Promise<any> {
    // Tạo form mẫu dựa trên prompt (placeholder — có thể tích hợp OpenAI sau)
    const defaultQuestions = [
      {
        id: 'q1',
        type: 'single_choice',
        title: 'Tình trạng việc làm hiện tại',
        required: true,
        sectionId: 's1',
        order: 1,
        options: [
          { id: 'o1', label: 'Đang làm việc toàn thời gian' },
          { id: 'o2', label: 'Đang làm việc bán thời gian' },
          { id: 'o3', label: 'Đang tìm việc' },
          { id: 'o4', label: 'Tiếp tục học' },
        ],
      },
    ];
    return {
      name: `Form từ AI: ${prompt.slice(0, 50)}`,
      description: `Form được tạo tự động từ prompt: ${prompt}`,
      sections: [{ id: 's1', title: 'Thông tin chung', order: 1 }],
      questions: defaultQuestions,
    };
  }

  mapToForm(survey: Survey): any {
    const sections = (survey.settings as any)?.sections ?? [];
    const questions = (survey.questions ?? []).map((q) => ({
      id: q.settings?.['id'] ?? String(q.id),
      type: q.questionType,
      title: q.questionText,
      placeholder: q.settings?.['placeholder'],
      options: q.options ? JSON.parse(q.options as string) : undefined,
      required: q.isRequired,
      sectionId: q.settings?.['sectionId'] ?? '',
      order: q.orderIndex,
      visibleWhen: q.settings?.['visibleWhen'],
      reportFieldKey: q.settings?.['reportFieldKey'],
      showInChart: q.settings?.['showInChart'],
      chartType: q.settings?.['chartType'],
      reportTemplate: q.settings?.['reportTemplate'],
      excelColumn: q.settings?.['excelColumn'],
    }));
    return {
      id: survey.id,
      name: survey.title,
      description: survey.description,
      sections,
      questions,
      themeId: survey.themeConfig?.['themeId'] ?? '',
      header: survey.themeConfig?.['header'] ?? null,
      footer: survey.themeConfig?.['footer'] ?? null,
      status: survey.status,
      created_at: survey.createdAt,
      updated_at: survey.updatedAt,
    };
  }
}
