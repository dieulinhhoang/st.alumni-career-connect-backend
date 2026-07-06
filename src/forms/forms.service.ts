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
    const { status, ...data } = dto as any;
    await this.formRepo.update({ id }, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.formRepo.softDelete({ id });
  }

  async duplicate(id: number): Promise<any> {
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

  async getQuestions(query: any): Promise<any[]> {
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

    return allQuestions;
  }

    async publish(id: number): Promise<FormEntity> {
    await this.findOne(id);
    await this.formRepo.update({ id }, { status: 'published' });
    return this.findOne(id);
  }

  async unpublish(id: number): Promise<FormEntity> {
    await this.findOne(id);
    await this.formRepo.update({ id }, { status: 'draft' });
    return this.findOne(id);
}
}
