import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Form, FormPayloadDto, QuestionDto, SectionDto } from './dto/form.dto';

@Injectable()
export class FormsService {
  private readonly forms = new Map<string, Form>();

  findAll(): Form[] {
    return Array.from(this.forms.values());
  }

  findOne(id: string): Form {
    const form = this.forms.get(id);
    if (!form) {
      throw new NotFoundException(`Form with id "${id}" not found`);
    }
    return form;
  }

  create(payload: FormPayloadDto): Form {
    const normalized = this.normalizePayload(payload);
    const now = new Date().toISOString();
    const form: Form = {
      id: randomUUID(),
      ...normalized,
      createdAt: now,
      updatedAt: now,
    };
    this.forms.set(form.id, form);
    return form;
  }

  replace(id: string, payload: FormPayloadDto): Form {
    const existing = this.findOne(id);
    const normalized = this.normalizePayload(payload);
    const updated: Form = {
      id: existing.id,
      ...normalized,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.forms.set(id, updated);
    return updated;
  }

  update(id: string, payload: Partial<FormPayloadDto>): Form {
    const existing = this.findOne(id);
    const merged: FormPayloadDto = {
      name: payload.name ?? existing.name,
      description: payload.description ?? existing.description,
      sections: payload.sections ?? existing.sections,
      questions: payload.questions ?? existing.questions,
    };
    const normalized = this.normalizePayload(merged);
    const updated: Form = {
      id: existing.id,
      ...normalized,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.forms.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.forms.delete(id)) {
      throw new NotFoundException(`Form with id "${id}" not found`);
    }
  }

  private normalizePayload(payload: FormPayloadDto): FormPayloadDto {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Form payload must be an object');
    }
    const { name, description, sections, questions } = payload;

    if (typeof name !== 'string') {
      throw new BadRequestException('"name" must be a string');
    }
    if (description != null && typeof description !== 'string') {
      throw new BadRequestException('"description" must be a string');
    }
    if (!Array.isArray(sections)) {
      throw new BadRequestException('"sections" must be an array');
    }
    if (!Array.isArray(questions)) {
      throw new BadRequestException('"questions" must be an array');
    }

    return {
      name,
      description: description ?? '',
      sections: sections.map((s) => this.normalizeSection(s)),
      questions: questions.map((q) => this.normalizeQuestion(q)),
    };
  }

  private normalizeSection(section: SectionDto): SectionDto {
    if (!section || typeof section.id !== 'string') {
      throw new BadRequestException('Each section must have a string "id"');
    }
    return {
      id: section.id,
      title: typeof section.title === 'string' ? section.title : '',
      order: typeof section.order === 'number' ? section.order : 0,
    };
  }

  private normalizeQuestion(question: QuestionDto): QuestionDto {
    if (!question || typeof question.id !== 'string') {
      throw new BadRequestException('Each question must have a string "id"');
    }
    const options = Array.isArray(question.options) ? question.options : [];
    return {
      id: question.id,
      type: typeof question.type === 'string' ? question.type : 'text',
      title: typeof question.title === 'string' ? question.title : '',
      required: Boolean(question.required),
      options: options.map((o) => ({
        id: typeof o?.id === 'string' ? o.id : '',
        label: typeof o?.label === 'string' ? o.label : '',
      })),
      sectionId:
        typeof question.sectionId === 'string' ? question.sectionId : '',
      order: typeof question.order === 'number' ? question.order : 0,
    };
  }
}
