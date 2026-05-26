import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { SurveyResponse } from '../database/entities/survey-response.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(AlumniBatch)
    private batchRepo: Repository<AlumniBatch>,
    @InjectRepository(SurveyResponse)
    private responseRepo: Repository<SurveyResponse>,
  ) {}

  async findAll(): Promise<AlumniBatch[]> {
    return this.batchRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<AlumniBatch> {
    const batch = await this.batchRepo.findOneBy({ id });
    if (!batch) throw new NotFoundException(`Không tìm thấy batch #${id}`);
    return batch;
  }

  async create(dto: CreateBatchDto): Promise<AlumniBatch> {
    const batch = this.batchRepo.create(dto);
    return this.batchRepo.save(batch);
  }

  async update(id: number, dto: UpdateBatchDto): Promise<AlumniBatch> {
    await this.findOne(id);
    await this.batchRepo.update({ id }, dto as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.batchRepo.softDelete({ id });
  }

  async getStats(batchId: number) {
    const batch = await this.findOne(batchId);
    const total = batch.totalStudents ?? 0;

    const submitted = await this.responseRepo.count({
      where: { surveyId: batch.formId, status: 'submitted' },
    });

    const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return { total, submitted, rate };
  }
}
