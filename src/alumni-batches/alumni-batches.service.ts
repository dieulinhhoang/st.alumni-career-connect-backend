import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class AlumniBatchesService {
  constructor(
    @InjectRepository(AlumniBatch)
    private batchRepo: Repository<AlumniBatch>,
    @InjectRepository(AlumniBatchResponse)
    private responseRepo: Repository<AlumniBatchResponse>,
  ) {}

  async findAll(): Promise<AlumniBatch[]> {
    return this.batchRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AlumniBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id },
    });
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
    await this.batchRepo.delete({ id });
  }

  async getStats(batchId: number) {
    const batch = await this.findOne(batchId);
    const total = batch.totalStudents ?? 0;

    const submitted = await this.responseRepo.count({
      where: {
        batch: { id: batchId },
        status: 'submitted',
      } as any,
    });

    const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { total, submitted, rate };
  }

  async submitResponse(
    batchId: number,
    dto: {
      studentId: string;
      studentName: string;
      studentEmail: string;
      studentPhone?: string;
      answers: Record<string, any>;
    },
  ): Promise<AlumniBatchResponse> {
    const batch = await this.findOne(batchId);
    const now = new Date();
    const startDate = batch.startDate ? new Date(batch.startDate) : null;
    const endDate = batch.endDate ? new Date(batch.endDate) : null;

    if (
      batch.status !== 'active' ||
      (startDate && now < startDate) ||
      (endDate && now > endDate)
    ) {
      throw new ConflictException('Đợt khảo sát này hiện không mở hoặc đã kết thúc.');
    }

    const existing = await this.responseRepo.findOne({
      where: {
        batch: { id: batchId },
        studentId: dto.studentId,
        status: 'submitted',
      } as any,
      relations: ['batch'],
    });

    if (existing) {
      throw new ConflictException('Bạn đã nộp phiếu khảo sát này rồi.');
    }

    const response = this.responseRepo.create({
      batch,
      studentId: dto.studentId,
      studentName: dto.studentName,
      studentEmail: dto.studentEmail,
      studentPhone: dto.studentPhone ?? undefined,
      answers: dto.answers,
      status: 'submitted',
      submittedAt: new Date(),
    });

    return await this.responseRepo.save(response);
  }

  async getResponses(batchId: number) {
    await this.findOne(batchId);
    return this.responseRepo.find({
      where: {
        batch: { id: batchId },
      } as any,
      relations: ['batch'],
      order: { submittedAt: 'DESC' },
    });
  }
}