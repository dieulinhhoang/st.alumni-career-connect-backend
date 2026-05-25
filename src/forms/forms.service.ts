import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { FormEntity } from '../database/entities/form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { GetFormsDto } from './dto/get-forms.dto';
import { GenerateAIFormDto } from './dto/generate-ai-form.dto';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(FormEntity)
    private readonly formRepo: Repository<FormEntity>,
  ) {}

  async findAll(query: GetFormsDto) {
    const { search, page = 1, pageSize = 10 } = query;
    const where = search ? { name: Like(`%${search}%`) } : {};

    const [data, total] = await this.formRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(id: number): Promise<FormEntity> {
    const form = await this.formRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException(`Form #${id} không tồn tại`);
    return form;
  }

  async create(dto: CreateFormDto): Promise<FormEntity> {
    const form = this.formRepo.create(dto);
    return this.formRepo.save(form);
  }

  async update(id: number, dto: UpdateFormDto): Promise<FormEntity> {
    const form = await this.findOne(id);
    Object.assign(form, dto);
    return this.formRepo.save(form);
  }

  async remove(id: number): Promise<void> {
    const form = await this.findOne(id);
    await this.formRepo.softDelete(form.id);
  }

  async duplicate(id: number): Promise<FormEntity> {
    const original = await this.findOne(id);
    const copy = this.formRepo.create({
      name: `${original.name} (Bản sao)`,
      description: original.description,
      sections: original.sections,
      questions: original.questions,
      themeId: original.themeId,
      header: original.header,
      footer: original.footer,
      status: 'draft',
    });
    return this.formRepo.save(copy);
  }

  async generateWithAI(dto: GenerateAIFormDto): Promise<object> {
    // Stub: trả về mẫu form tự sinh dựa trên prompt
    // TODO: tích hợp OpenAI / Gemini API
    const { prompt } = dto;
    return {
      name: `Phiếu khảo sát: ${prompt}`,
      description: `Tự động tạo từ prompt: "${prompt}"`,
      sections: [
        { id: 's1', title: 'Thông tin chung', order: 1 },
        { id: 's2', title: 'Nội dung khảo sát', order: 2 },
      ],
      questions: [
        {
          id: 'q1',
          type: 'text',
          title: 'Họ và tên',
          required: true,
          sectionId: 's1',
          order: 1,
        },
        {
          id: 'q2',
          type: 'single_choice',
          title: 'Tình trạng việc làm hiện tại',
          required: true,
          sectionId: 's2',
          order: 1,
          options: [
            { id: 'o1', label: 'Đã có việc làm đúng ngành' },
            { id: 'o2', label: 'Đã có việc làm trái ngành' },
            { id: 'o3', label: 'Chưa có việc làm' },
            { id: 'o4', label: 'Đang học tiếp' },
          ],
        },
        {
          id: 'q3',
          type: 'single_choice',
          title: 'Mức thu nhập bình quân hàng tháng',
          required: false,
          sectionId: 's2',
          order: 2,
          options: [
            { id: 'o1', label: 'Dưới 5 triệu' },
            { id: 'o2', label: '5 - 10 triệu' },
            { id: 'o3', label: '10 - 15 triệu' },
            { id: 'o4', label: 'Trên 15 triệu' },
          ],
        },
      ],
    };
  }
}
