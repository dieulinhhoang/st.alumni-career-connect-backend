import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { FormEntity } from 'src/database/entities/form.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { Student } from 'src/database/entities/student.entity';

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
    @InjectRepository(FormEntity)
    private formRepo: Repository<FormEntity>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(GraduationStudent)
    private graduationStudentRepo: Repository<GraduationStudent>,
    private emailService: EmailService,
  ) { }

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
    // Tự fetch form và lưu snapshot ngay khi tạo batch
    const form = await this.formRepo.findOneBy({ id: dto.formId });
    if (!form) throw new NotFoundException(`Không tìm thấy form #${dto.formId}`);

    const batch = this.batchRepo.create({
      ...dto,
      startDate: toDateOnly(dto.startDate),
      endDate: toDateOnly(dto.endDate),
      formSnapshot: form as any,
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
  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  //email 
  async sendInviteEmails(batchId: number, emailDto: SendEmailDto): Promise<{ sent: number; failed: number }> {
    const batch = await this.findOne(batchId);
    if (!batch.graduationId) {
      throw new NotFoundException('Khảo sát này chưa liên kết với kỳ tốt nghiệp nào');
    }
    const graduationStudents = await this.graduationStudentRepo.find({
      where: { graduationId: batch.graduationId } as any,
      relations: ['student'],
    });

    const surveyUrl = `${process.env.CLIENT_APP_URL ?? 'http://localhost:5173'}/survey/${batchId}/${this.toSlug(batch.title)}}`;
    const recipients = graduationStudents.map(gs => ({
      email: gs.student.email,
      subject: emailDto.subject,
      html: `${emailDto.htmlBody}<br><br><a href="${surveyUrl}">Click vào đây để tham gia khảo sát</a>`,
    }));
    return await this.emailService.sendBulk(recipients);
  }
}