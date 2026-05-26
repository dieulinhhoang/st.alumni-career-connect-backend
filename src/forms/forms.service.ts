import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormEntity } from 'src/database/entities/form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { GenerateAiFormDto } from './dto/generate-ai-form.dto';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(FormEntity)
    private formRepo: Repository<FormEntity>,
  ) {}

  async findAll(query: any): Promise<FormEntity[]> {
    return this.formRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<FormEntity> {
    const form = await this.formRepo.findOneBy({ id });
    if (!form) throw new NotFoundException(`Không tìm thấy form #${id}`);
    return form;
  }

  async create(dto: CreateFormDto): Promise<FormEntity> {
    const form = this.formRepo.create(dto);
    return this.formRepo.save(form);
  }

  async update(id: number, dto: UpdateFormDto): Promise<FormEntity> {
    await this.findOne(id);
    await this.formRepo.update({ id }, dto as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.formRepo.softDelete({ id });
  }

  async duplicate(id: number): Promise<FormEntity> {
    const original = await this.findOne(id);
    const { id: _id, createdAt, updatedAt, deletedAt, ...rest } = original as any;
    const copy = this.formRepo.create({
      ...rest,
      name: `${original.name} (Copy)`,
      status: 'draft',
    });
    return this.formRepo.save(copy);
  }

  async generateAi(dto: GenerateAiFormDto): Promise<FormEntity> {
    // Placeholder: tạo form mẫu dựa trên topic, có thể tích hợp AI sau
    const questions = Array.from({ length: dto.questionCount ?? 5 }, (_, i) => ({
      id: i + 1,
      type: 'text',
      label: `Câu hỏi ${i + 1} về ${dto.topic}`,
      required: false,
    }));
    const form = this.formRepo.create({
      name: `[AI] Form về ${dto.topic}`,
      description: dto.context ?? '',
      questions,
      status: 'draft',
    });
    return this.formRepo.save(form);
  }

  async getQuestions(query: any) {
    const forms = await this.formRepo.find({ order: { id: 'ASC' } });
    const allQuestions: any[] = [];
    for (const form of forms) {
      if (query.formId && String(form.id) !== String(query.formId)) continue;
      const qs: any[] = (form.questions as any[]) ?? [];
      qs.forEach((q: any) => {
        allQuestions.push({
          id: String(q.id ?? q.key ?? allQuestions.length + 1),
          title: q.label ?? q.title ?? q.questionText ?? '',
          chartType: ['radio', 'checkbox', 'select'].includes(q.type) ? 'pie' : 'bar',
        });
      });
    }
    const questions = await qb.orderBy('q.order', 'ASC').getMany();
     return questions.map((q) => ({
    id: String(q.id),
    title: q.questionText,
    chartType:
      q.questionType === 'radio' ||
      q.questionType === 'checkbox' ||
      q.questionType === 'select'
        ? 'pie'
        : 'bar',
  }));

  }
}
