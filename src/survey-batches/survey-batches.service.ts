import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyBatch } from 'src/database/entities/survey-batch.entity';
import { CreateSurveyBatchDto } from './dto/create-survey-batch.dto';
import { UpdateSurveyBatchDto } from './dto/update-survey-batch.dto';

@Injectable()
export class SurveyBatchesService {
  constructor(
    @InjectRepository(SurveyBatch)
    private batchRepo: Repository<SurveyBatch>,
  ) {}

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 20);
    const qb = this.batchRepo.createQueryBuilder('b');

    if (query.status) qb.andWhere('b.status = :status', { status: query.status });
    if (query.year) qb.andWhere('b.year = :year', { year: query.year });

    qb.orderBy('b.id', 'DESC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();
    // FE expect mảng có responses: []
    const formatted = items.map(item => ({ ...item, responses: [] }));
    return { items: formatted, page, size, total, totalPages: Math.ceil(total / size) };
  }

  create(dto: CreateSurveyBatchDto) {
    const batch = this.batchRepo.create(dto);
    return this.batchRepo.save(batch);
  }

  async findOne(id: number) {
    const batch = await this.batchRepo.findOneBy({ id });
    if (!batch) throw new NotFoundException(`Kh\u00f4ng t\u00ecm th\u1ea5y batch #${id}`);
    return { ...batch, responses: [] };
  }

  async update(id: number, dto: UpdateSurveyBatchDto) {
    await this.findOne(id);
    await this.batchRepo.update({ id }, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.batchRepo.delete({ id });
  }
}
