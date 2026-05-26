import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniResponse } from 'src/database/entities/alumni-response.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(AlumniBatch)
    private batchRepo: Repository<AlumniBatch>,
    @InjectRepository(AlumniResponse)
    private responseRepo: Repository<AlumniResponse>,
  ) {}

  async getBatches(): Promise<AlumniBatch[]> {
    return this.batchRepo.find({
      order: { id: 'DESC' },
      withDeleted: false,
    });
  }

  async getBatchById(id: number): Promise<AlumniBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['responses'],
    });
    if (!batch) throw new NotFoundException(`Không tìm thấy batch #${id}`);
    return batch;
  }

  async createBatch(dto: CreateBatchDto): Promise<AlumniBatch> {
    const batch = this.batchRepo.create(dto as Partial<AlumniBatch>);
    return this.batchRepo.save(batch);
  }

  async updateBatch(id: number, dto: UpdateBatchDto): Promise<AlumniBatch> {
    await this.getBatchById(id);
    await this.batchRepo.update({ id }, dto as Partial<AlumniBatch>);
    return this.batchRepo.findOneBy({ id });
  }

  async deleteBatch(id: number): Promise<void> {
    await this.getBatchById(id);
    await this.batchRepo.softDelete({ id });
  }

  async getBatchStats(batchId: number) {
    const batch = await this.getBatchById(batchId);
    const responses = await this.responseRepo.find({ where: { batchId } });
    const submitted = responses.filter((r) => r.status === 'submitted');
    const total = batch.totalStudents || responses.length;
    const rate = total > 0 ? Math.round((submitted.length / total) * 100) : 0;

    // Tính tỷ lệ có việc làm từ answers (nếu có trường 'employment_status')
    const employed = submitted.filter(
      (r) => r.answers?.employment_status === 'employed',
    );
    const employmentRate =
      submitted.length > 0
        ? Math.round((employed.length / submitted.length) * 100)
        : 0;

    return {
      total,
      submitted: submitted.length,
      rate,
      employmentRate,
      suitableRate: null,
    };
  }
}
