import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

/** Cắt ISO string về 'YYYY-MM-DD' cho MySQL DATE column */
function toDateOnly(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

@Injectable()
export class AlumniBatchesService {
  constructor(
    @InjectRepository(AlumniBatch)
    private batchRepo: Repository<AlumniBatch>,
    @InjectRepository(AlumniBatchResponse)
    private responseRepo: Repository<AlumniBatchResponse>,
  ) {}

  /**
   * Trả về danh sách batch kèm submittedCount để FE hiển thị % phản hồi
   * mà không cần load toàn bộ responses array
   */
  async findAll(): Promise<(AlumniBatch & { submittedCount: number })[]> {
    const batches = await this.batchRepo.find({
      order: { createdAt: 'DESC' },
    });

    // Đếm submitted responses cho từng batch trong 1 query GROUP BY
    const counts: { batchId: string; cnt: string }[] = await this.responseRepo
      .createQueryBuilder('r')
      .select('r.batch_id', 'batchId')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.status = :status', { status: 'submitted' })
      .groupBy('r.batch_id')
      .getRawMany();

    const countMap = new Map(counts.map((c) => [Number(c.batchId), Number(c.cnt)]));

    return batches.map((b) => ({
      ...b,
      submittedCount: countMap.get(Number(b.id)) ?? 0,
    }));
  }

  async findOne(id: number): Promise<AlumniBatch> {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) throw new NotFoundException(`Không tìm thấy batch #${id}`);
    return batch;
  }

  async create(dto: CreateBatchDto): Promise<AlumniBatch> {
    const batch = this.batchRepo.create({
      ...dto,
      startDate: toDateOnly(dto.startDate),
      endDate: toDateOnly(dto.endDate),
    });
    return this.batchRepo.save(batch);
  }

  async update(id: number, dto: UpdateBatchDto): Promise<AlumniBatch> {
    await this.findOne(id);
    await this.batchRepo.update({ id }, {
      ...dto as any,
      ...(dto.startDate !== undefined && { startDate: toDateOnly(dto.startDate) }),
      ...(dto.endDate !== undefined && { endDate: toDateOnly(dto.endDate) }),
    });
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
      where: { batch: { id: batchId }, status: 'submitted' } as any,
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
      where: { batch: { id: batchId }, studentId: dto.studentId, status: 'submitted' } as any,
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
      where: { batch: { id: batchId } } as any,
      relations: ['batch'],
      order: { submittedAt: 'DESC' },
    });
  }
}