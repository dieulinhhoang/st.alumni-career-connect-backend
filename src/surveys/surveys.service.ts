import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
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
    private readonly dataSource: DataSource, // FIX: inject DataSource để dùng transaction
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
      const questions = dto.questions.map((q, index) =>
        this.questionRepo.create({
          surveyId: saved.id,
          sectionId: this.normalizeSectionId(q.sectionId),
          questionKey: q.id ?? `q_${index + 1}`,
          questionText: q.title,
          questionType: this.normalizeQuestionType(q.type),
          options: q.options ?? null,
          isRequired: q.required ? 1 : 0,
          orderIndex: q.order ?? index + 1,
          visibleWhen: q.visibleWhen ?? null,
          reportFieldKey: q.reportFieldKey ?? null,
          showInChart: q.showInChart ? 1 : 0,
          chartType: this.normalizeChartType(q.chartType),
          reportTemplate: q.reportTemplate ?? null,
          excelColumn: q.excelColumn ?? null,
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

    return {
      data: data.map((s) => this.mapToForm(s)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { id },
      relations: ['sections', 'questions'],
    });

    if (!survey) {
      throw new NotFoundException(`Form #${id} không tìm thấy`);
    }

    return survey;
  }

  // FIX: Dùng transaction để update survey + questions nguyên tử
  // tránh tình trạng xóa xong nhưng insert lại lỗi khiến mất dữ liệu
  async update(id: number, dto: UpdateSurveyDto): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const survey = await manager.findOne(Survey, {
        where: { id },
        relations: ['sections', 'questions'],
      });

      if (!survey) throw new NotFoundException(`Form #${id} không tìm thấy`);

      if (dto.name !== undefined) survey.title = dto.name;
      if (dto.description !== undefined) survey.description = dto.description;

      if (
        dto.themeId !== undefined ||
        dto.header !== undefined ||
        dto.footer !== undefined
      ) {
        survey.themeConfig = {
          ...(survey.themeConfig ?? {}),
          themeId: dto.themeId ?? survey.themeConfig?.themeId ?? null,
          header:  dto.header  ?? survey.themeConfig?.header  ?? null,
          footer:  dto.footer  ?? survey.themeConfig?.footer  ?? null,
        };
      }

      if (dto.sections !== undefined) {
        survey.settings = {
          ...(survey.settings ?? {}),
          sections: dto.sections,
        };
      }

      await manager.save(Survey, survey);

      if (dto.questions !== undefined) {
        // FIX: Xóa và insert lại trong cùng transaction
        await manager.delete(SurveyQuestion, { surveyId: id });

        if (dto.questions.length > 0) {
          const questions = dto.questions.map((q, index) =>
            manager.create(SurveyQuestion, {
              surveyId: id,
              sectionId: this.normalizeSectionId(q.sectionId),
              questionKey: q.id ?? `q_${index + 1}`,
              questionText: q.title,
              questionType: this.normalizeQuestionType(q.type),
              options: q.options ?? null,
              isRequired: q.required ? 1 : 0,
              orderIndex: q.order ?? index + 1,
              visibleWhen: q.visibleWhen ?? null,
              reportFieldKey: q.reportFieldKey ?? null,
              showInChart: q.showInChart ? 1 : 0,
              chartType: this.normalizeChartType(q.chartType),
              reportTemplate: q.reportTemplate ?? null,
              excelColumn: q.excelColumn ?? null,
            }),
          );

          await manager.save(SurveyQuestion, questions);
        }
      }

      const updated = await manager.findOne(Survey, {
        where: { id },
        relations: ['sections', 'questions'],
      });

      return this.mapToForm(updated!);
    });
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
      const questions = original.questions.map((q, index) =>
        this.questionRepo.create({
          surveyId: saved.id,
          sectionId: q.sectionId ?? null,
          questionKey: q.questionKey ?? `q_${index + 1}`,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options ?? null,
          isRequired: q.isRequired ?? 0,
          orderIndex: q.orderIndex ?? index + 1,
          visibleWhen: q.visibleWhen ?? null,
          reportFieldKey: q.reportFieldKey ?? null,
          showInChart: q.showInChart ?? 0,
          chartType: q.chartType ?? null,
          reportTemplate: q.reportTemplate ?? null,
          excelColumn: q.excelColumn ?? null,
        }),
      );

      await this.questionRepo.save(questions);
    }

    return this.mapToForm(await this.findOne(saved.id));
  }

  // FIX: Thêm setStatus để xử lý publish/unpublish
  async setStatus(id: number, status: 'draft' | 'published' | 'closed' | 'archived'): Promise<any> {
    const survey = await this.findOne(id);
    survey.status = status;
    await this.surveyRepo.save(survey);
    return this.mapToForm(await this.findOne(id));
  }

  async generateWithAI(prompt: string): Promise<any> {
    const defaultQuestions = [
      {
        id: 'q1',
        type: 'radio',
        title: 'Tình trạng việc làm hiện tại',
        required: true,
        sectionId: '1',
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
      sections: [{ id: '1', title: 'Thông tin chung', order: 1 }],
      questions: defaultQuestions,
    };
  }

  async getQuestions(query: any) {
    const qb = this.questionRepo.createQueryBuilder('q');

    if (query.formId || query.surveyId) {
      const sid = Number(query.formId ?? query.surveyId);
      qb.andWhere('q.surveyId = :sid', { sid });
    }

    const questions = await qb.orderBy('q.orderIndex', 'ASC').getMany();

    return questions.map((q) => ({
      id: String(q.id),
      title: q.questionText,
      chartType:
        q.chartType ??
        (['radio', 'checkbox', 'select'].includes(q.questionType)
          ? 'pie'
          : 'column'),
    }));
  }

  mapToForm(survey: Survey): any {
    const sections = (survey.settings as any)?.sections ?? [];

    const questions = (survey.questions ?? []).map((q) => ({
      id: q.questionKey ?? String(q.id),
      type: q.questionType,
      title: q.questionText,
      placeholder: undefined,
      options: q.options ?? undefined,
      required: !!q.isRequired,
      sectionId: q.sectionId ? String(q.sectionId) : '',
      order: q.orderIndex,
      visibleWhen: q.visibleWhen ?? undefined,
      reportFieldKey: q.reportFieldKey ?? undefined,
      showInChart: !!q.showInChart,
      chartType: q.chartType ?? undefined,
      reportTemplate: q.reportTemplate ?? undefined,
      excelColumn: q.excelColumn ?? undefined,
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

  private normalizeQuestionType(type: string): SurveyQuestion['questionType'] {
    const map: Record<string, SurveyQuestion['questionType']> = {
      text:            'text',
      textarea:        'textarea',
      radio:           'radio',
      checkbox:        'checkbox',
      select:          'select',
      date:            'date',
      number:          'number',
      rating:          'rating',
      upload:          'upload',
      single_choice:   'radio',
      multiple_choice: 'checkbox',
      short:           'text',
      long:            'textarea',
      dropdown:        'select',
      email:           'text',
      tel:             'text',
    };

    return map[type] ?? 'text';
  }

  private normalizeChartType(
    chartType?: string | null,
  ): SurveyQuestion['chartType'] | null {
    if (!chartType) return null;
    if (chartType === 'pie') return 'pie';
    if (chartType === 'column') return 'column';
    if (chartType === 'bar') return 'column';
    return null;
  }

  private normalizeSectionId(sectionId: any): number | null {
    if (sectionId === null || sectionId === undefined || sectionId === '') {
      return null;
    }

    const parsed = Number(sectionId);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
