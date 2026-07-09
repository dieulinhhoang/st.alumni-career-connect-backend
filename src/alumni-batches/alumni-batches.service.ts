import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
import { SurveysService } from 'src/surveys/surveys.service';
import { AlumniProfileSyncService } from './alumni-profile-sync.service';

/** Cắt ISO string về 'YYYY-MM-DD' cho MySQL DATE column */
function toDateOnly(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

/** Chuẩn hoá giá trị DATE (string hoặc Date) về 'YYYY-MM-DD' */
function toDateStr(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Đầu ngày (00:00:00) theo giờ server, từ giá trị DATE */
function dayStart(value: any): Date | null {
  const s = toDateStr(value);
  return s ? new Date(`${s}T00:00:00`) : null;
}

/** Cuối ngày (23:59:59.999) theo giờ server — để đợt khảo sát mở hết ngày kết thúc */
function dayEnd(value: any): Date | null {
  const s = toDateStr(value);
  return s ? new Date(`${s}T23:59:59.999`) : null;
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
    private surveysService: SurveysService,
    private profileSyncService: AlumniProfileSyncService,
  ) { }

  /**
   * Trả về danh sách batch kèm submittedCount để FE hiển thị % phản hồi
   * mà không cần load toàn bộ responses array
   */
  async findAll(): Promise<(AlumniBatch & { submittedCount: number })[]> {
    const batches = await this.batchRepo.find({
      order: { createdAt: 'DESC' },
    });
    await this.autoEndExpired(batches);

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
    await this.autoEndExpired([batch]);

    // formSnapshot có thể bị thiếu (batch tạo trước khi form tồn tại, import legacy, v.v.)
    // -> tự build lại từ form gốc để tránh hiển thị "Không có form snapshot"
    if (!batch.formSnapshot && batch.formId) {
      try {
        const form = await this.surveysService.findOne(batch.formId);
        const formSnapshot = this.surveysService.mapToForm(form);
        await this.batchRepo.update(id, { formSnapshot: formSnapshot as any });
        batch.formSnapshot = formSnapshot as any;
      } catch {
        // form gốc không còn tồn tại -> giữ formSnapshot null, FE sẽ hiển thị thông báo
      }
    }

    return batch;
  }

  /** Tự chuyển status 'active' -> 'ended' cho các batch đã quá endDate, đồng bộ luôn DB */
  private async autoEndExpired(batches: AlumniBatch[]): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired = batches.filter(
      (b) => b.status === 'active' && b.endDate && new Date(b.endDate) < today,
    );
    if (expired.length === 0) return;

    await this.batchRepo.update(expired.map((b) => b.id), { status: 'ended' });
    expired.forEach((b) => { b.status = 'ended'; });
  }

  async create(dto: CreateBatchDto): Promise<AlumniBatch> {
    this.assertDateOrder(dto.startDate, dto.endDate);
    // FIX: snapshot phải build từ bảng `surveys` (giống refreshFormSnapshot).
    // Trước đây tra bảng `forms` legacy bằng survey id: local thường trả null
    // (được backfill sau), nhưng nếu id trùng với một form cũ thì snapshot sai
    // → trang khảo sát công khai hiển thị câu hỏi mất options.
    let formSnapshot: Record<string, any> | null = null;
    try {
      const survey = await this.surveysService.findOne(dto.formId);
      formSnapshot = this.surveysService.mapToForm(survey);
    } catch {
      // form không tồn tại → giữ null, findOne() sẽ tự backfill khi form xuất hiện
    }

    const batch = this.batchRepo.create({
      ...dto,
      startDate: toDateOnly(dto.startDate),
      endDate: toDateOnly(dto.endDate),
      formSnapshot: formSnapshot as any,
    });
    return this.batchRepo.save(batch);
  }

  async update(id: number, dto: UpdateBatchDto): Promise<AlumniBatch> {
    const batch = await this.findOne(id);
    if (batch.status !== 'draft') {
      throw new ConflictException('Chỉ có thể chỉnh sửa đợt khảo sát khi đang ở trạng thái nháp.');
    }
    // Ngày hiệu lực sau khi áp dto (dto ghi đè giá trị cũ)
    const effStart = dto.startDate !== undefined ? dto.startDate : batch.startDate;
    const effEnd = dto.endDate !== undefined ? dto.endDate : batch.endDate;
    this.assertDateOrder(effStart, effEnd);
    await this.batchRepo.update({ id }, {
      ...dto as any,
      ...(dto.startDate !== undefined && { startDate: toDateOnly(dto.startDate) }),
      ...(dto.endDate !== undefined && { endDate: toDateOnly(dto.endDate) }),
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const responseCount = await this.responseRepo.count({
      where: { batchId: id, status: 'submitted' },
    });
    if (responseCount > 0) {
      throw new ConflictException(
        'Không thể xóa đợt khảo sát đã có sinh viên phản hồi.',
      );
    }

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
    // startDate tính từ 00:00:00; endDate tính tới 23:59:59.999 để đợt mở trọn ngày kết thúc
    const startDate = dayStart(batch.startDate);
    const endDate = dayEnd(batch.endDate);

    if (
      batch.status !== 'active' ||
      (startDate && now < startDate) ||
      (endDate && now > endDate)
    ) {
      throw new ConflictException('Đợt khảo sát này hiện không mở hoặc đã kết thúc.');
    }

    // Chống nộp bằng mã SV bịa: nếu đợt gắn với kỳ tốt nghiệp và người nộp có nhập mã SV,
    // mã đó phải thuộc danh sách sinh viên của kỳ tốt nghiệp.
    if (batch.graduationId && dto.studentId?.trim()) {
      const inCohort = await this.isStudentInGraduation(batch.graduationId, dto.studentId);
      if (!inCohort) {
        throw new ForbiddenException('Mã sinh viên không thuộc danh sách khảo sát của đợt này.');
      }
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

    const saved = await this.responseRepo.save(response);
    this.profileSyncService.syncFromResponse(saved, batch).catch(() => {});
    return saved;
  }

  async getResponses(batchId: number) {
    await this.findOne(batchId);
    return this.responseRepo.find({
      where: { batch: { id: batchId } } as any,
      relations: ['batch'],
      order: { submittedAt: 'DESC' },
    });
  }

  async createResponseByAdmin(
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

    const existing = await this.responseRepo.findOne({
      where: { batch: { id: batchId }, studentId: dto.studentId, status: 'submitted' } as any,
      relations: ['batch'],
    });
    if (existing) throw new ConflictException('Sinh viên này đã có phản hồi trong đợt khảo sát.');

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
    const savedAdmin = await this.responseRepo.save(response);
    this.profileSyncService.syncFromResponse(savedAdmin, batch).catch(() => {});
    return savedAdmin;
  }

  async updateResponse(batchId: number, responseId: number, answers: Record<string, any>) {
    const response = await this.responseRepo.findOne({
      where: { id: responseId, batch: { id: batchId } } as any,
      relations: ['batch'],
    });
    if (!response) throw new NotFoundException(`Không tìm thấy phản hồi #${responseId}`);
    response.answers = answers;
    const updatedResp = await this.responseRepo.save(response);
    this.profileSyncService.syncFromResponse(updatedResp, response.batch).catch(() => {});
    return updatedResp;
  }
  /** Kiểm tra mã SV có thuộc danh sách sinh viên của kỳ tốt nghiệp không */
  private async isStudentInGraduation(graduationId: number, studentCode: string): Promise<boolean> {
    const norm = (s: string) => s?.trim().toLowerCase();
    const target = norm(studentCode);
    if (!target) return false;
    const cohort = await this.graduationStudentRepo.find({
      where: { graduationId } as any,
      relations: ['student'],
    });
    return cohort.some((gs) => gs.student && norm(gs.student.code) === target);
  }

  /** Chặn ngày kết thúc trước ngày bắt đầu */
  private assertDateOrder(start: any, end: any): void {
    const s = toDateStr(start);
    const e = toDateStr(end);
    if (s && e && e < s) {
      throw new BadRequestException('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
    }
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

    // const surveyUrl = `${process.env.CLIENT_APP_URL ?? 'http://localhost:5173'}/survey/${batchId}/${this.toSlug(batch.title)}}`;
    // const recipients = graduationStudents.map(gs => ({
    //   email: gs.student.email,
    //   subject: emailDto.subject,
    //   html: `${emailDto.htmlBody}<br><br><a href="${surveyUrl}">Click vào đây để tham gia khảo sát</a>`,
    // }));
    // return await this.emailService.sendBulk(recipients);

      const submitted = new Set(
        (await this.responseRepo.find({
          where: { batch: { id: batchId }, status: 'submitted' } as any,
          relations: ['batch'],
        })).map(r => r.studentId),
      );

      const recipients :Array<{ email: string; subject: string; html: string }> = [];
      let sent = 0;
      let failed = 0;

      for(const gs of graduationStudents) {
        const student = gs.student;
        if (!student.email) {
           failed++;
          continue;
        }
        
        const token = Buffer.from(`${batchId}:${student.code}`).toString('base64');
        const surveyUrl = `${process.env.CLIENT_APP_URL ?? 'http://localhost:5173'}/survey/${batchId}/${this.toSlug(batch.title)}?token=${token}`;
        const htmlContent = `${emailDto.htmlBody}<br><br><a href="${surveyUrl}">Click vào đây để tham gia khảo sát</a>`;

        recipients.push({
          email: student.email,
          subject: emailDto.subject,
          html: htmlContent
        });
        sent++;
      }
     const result = await this.emailService.sendBulk(recipients);
     return { sent: result.sent, failed: result.failed + failed }; // cộng thêm số sv không có email
    }

  async refreshFormSnapshot(id: number): Promise<{ updated: boolean; batchId: number; formId: number }> {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) throw new NotFoundException(`Batch #${id} không tồn tại`);
    if (!batch.formId) throw new NotFoundException(`Batch #${id} không có formId`);

    // const form = await this.formRepo.findOneBy({ id: batch.formId });
    // if (!form) throw new NotFoundException(`Không tìm thấy form #${batch.formId}`);
    // const formSnapshot = {
    //   sections: form.sections,
    //   questions: form.questions,
    //   header: form.header,
    //   footer: form.footer,
    //   themeId: form.themeId,
    // };
     const form = await this.surveysService.findOne(batch.formId);
    const formSnapshot = this.surveysService.mapToForm(form);
    await this.batchRepo.update(id, { formSnapshot: formSnapshot as any });
    return { updated: true, batchId: id, formId: batch.formId };
  }
}