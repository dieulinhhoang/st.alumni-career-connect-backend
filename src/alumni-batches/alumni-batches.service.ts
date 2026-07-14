import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { AlumniResponseHistory, ResponseFieldChange } from 'src/database/entities/alumni-response-history.entity';
import { FormEntity } from 'src/database/entities/form.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { Student } from 'src/database/entities/student.entity';
import { SurveysService } from 'src/surveys/surveys.service';
import { AlumniProfileSyncService } from './alumni-profile-sync.service';
import { ReportsService } from 'src/reports/reports.service';

/** Người thực hiện thao tác — rút từ JWT (req.user). Null nếu SV tự nộp công khai. */
export interface ResponseActor {
  id: number | null;
  name: string | null;
  /** Admin thì bỏ qua khóa "hết hạn không cho sửa" */
  isAdmin?: boolean;
}

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
export class AlumniBatchesService implements OnModuleInit {
  private readonly logger = new Logger(AlumniBatchesService.name);

  /** Chạy quét hết-hạn ngay khi app khởi động (không đợi tới lượt cron mỗi giờ) */
  async onModuleInit(): Promise<void> {
    await this.autoEndExpiredCron();
  }

  constructor(
    @InjectRepository(AlumniBatch)
    private batchRepo: Repository<AlumniBatch>,
    @InjectRepository(AlumniBatchResponse)
    private responseRepo: Repository<AlumniBatchResponse>,
    @InjectRepository(AlumniResponseHistory)
    private historyRepo: Repository<AlumniResponseHistory>,
    @InjectRepository(FormEntity)
    private formRepo: Repository<FormEntity>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(GraduationStudent)
    private graduationStudentRepo: Repository<GraduationStudent>,
    private emailService: EmailService,
    private surveysService: SurveysService,
    private profileSyncService: AlumniProfileSyncService,
    private reportsService: ReportsService,
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

  /**
   * Cron chạy nền mỗi giờ: tự kết thúc các đợt đã quá hạn và AUTO NỘP báo cáo,
   * kể cả khi không có ai truy cập (không phụ thuộc vào việc gọi list/detail).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoEndExpiredCron(): Promise<void> {
    const batches = await this.batchRepo.find({ where: { status: 'active' } });
    if (batches.length === 0) return;
    await this.autoEndExpired(batches);
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
    this.logger.log(`Đã kết thúc ${expired.length} đợt quá hạn: [${expired.map((b) => b.id).join(', ')}]`);

    // Đợt vừa hết hạn → tự động nộp báo cáo cho các khoa chưa nộp.
    // Nuốt lỗi để không chặn luồng chính (list/detail batch).
    await Promise.all(
      expired.map((b) =>
        this.reportsService.autoSubmitOnBatchEnd(b.id)
          .then(() => this.logger.log(`Auto nộp báo cáo cho đợt #${b.id}`))
          .catch((e) => this.logger.error(`[autoSubmitOnBatchEnd] batch ${b.id}: ${e?.message ?? e}`)),
      ),
    );
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
    this.profileSyncService.syncFromResponse(saved, batch).catch(() => { });
    // Ghi lịch sử: SV tự nộp lần đầu (actor = chính SV, không có user id)
    await this.recordHistory({
      responseId: saved.id,
      batchId,
      action: 'submit',
      actor: { id: null, name: dto.studentName || dto.studentId || 'Sinh viên' },
      changes: this.computeChanges({}, dto.answers, this.buildQuestionTitleMap(batch)),
    });
    return saved;
  }

  /**
   * Chặn thêm/sửa phản hồi khi đợt khảo sát đã hết hạn.
   * Admin có toàn quyền → bỏ qua khóa này (vẫn sửa/thêm được sau hạn).
   */
  private assertBatchOpenForEdit(batch: AlumniBatch, isAdmin = false): void {
    if (isAdmin) return;
    const end = dayEnd(batch.endDate);
    const expired = batch.status === 'ended' || (end != null && new Date() > end);
    if (expired) {
      throw new ConflictException('Đợt khảo sát đã kết thúc, không thể thêm/chỉnh sửa phản hồi.');
    }
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
    actor?: ResponseActor,
  ): Promise<AlumniBatchResponse> {
    const batch = await this.findOne(batchId);
    this.assertBatchOpenForEdit(batch, actor?.isAdmin);

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
    this.profileSyncService.syncFromResponse(savedAdmin, batch).catch(() => { });
    // Ghi lịch sử: admin nhập thay SV
    await this.recordHistory({
      responseId: savedAdmin.id,
      batchId,
      action: 'create',
      actor: actor ?? { id: null, name: null },
      changes: this.computeChanges({}, dto.answers, this.buildQuestionTitleMap(batch)),
    });
    return savedAdmin;
  }

  async updateResponse(
    batchId: number,
    responseId: number,
    answers: Record<string, any>,
    actor?: ResponseActor,
  ) {
    const response = await this.responseRepo.findOne({
      where: { id: responseId, batch: { id: batchId } } as any,
      relations: ['batch'],
    });
    if (!response) throw new NotFoundException(`Không tìm thấy phản hồi #${responseId}`);
    this.assertBatchOpenForEdit(response.batch, actor?.isAdmin);
    const before = response.answers ?? {};
    const changes = this.computeChanges(before, answers, this.buildQuestionTitleMap(response.batch));
    response.answers = answers;
    const updatedResp = await this.responseRepo.save(response);
    this.profileSyncService.syncFromResponse(updatedResp, response.batch).catch(() => { });
    // Chỉ ghi lịch sử khi thực sự có thay đổi
    if (changes.length > 0) {
      await this.recordHistory({
        responseId,
        batchId,
        action: 'update',
        actor: actor ?? { id: null, name: null },
        changes,
      });
    }
    return updatedResp;
  }

  /** Lấy lịch sử thao tác của một phản hồi (mới nhất trước) */
  async getResponseHistory(batchId: number, responseId: number): Promise<AlumniResponseHistory[]> {
    return this.historyRepo.find({
      where: { batchId, responseId } as any,
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  /** Map questionId -> tiêu đề câu hỏi, lấy từ formSnapshot của batch */
  private buildQuestionTitleMap(batch: AlumniBatch): Record<string, string> {
    const map: Record<string, string> = {};
    const questions = (batch?.formSnapshot as any)?.questions ?? [];
    for (const q of questions) {
      if (q?.id != null) map[String(q.id)] = q.title ?? String(q.id);
    }
    return map;
  }

  /** So sánh answers cũ/mới, trả về danh sách trường bị thay đổi */
  private computeChanges(
    oldAnswers: Record<string, any>,
    newAnswers: Record<string, any>,
    titleMap: Record<string, string>,
  ): ResponseFieldChange[] {
    const changes: ResponseFieldChange[] = [];
    const keys = new Set([
      ...Object.keys(oldAnswers ?? {}),
      ...Object.keys(newAnswers ?? {}),
    ]);
    const isEmpty = (v: any) =>
      v === null || v === undefined || v === '' ||
      (Array.isArray(v) && v.length === 0);
    const norm = (v: any) => (isEmpty(v) ? null : JSON.stringify(v));

    for (const key of keys) {
      const before = oldAnswers?.[key];
      const after = newAnswers?.[key];
      if (norm(before) === norm(after)) continue;
      changes.push({
        questionId: key,
        questionTitle: titleMap[key] ?? key,
        before: isEmpty(before) ? null : before,
        after: isEmpty(after) ? null : after,
      });
    }
    return changes;
  }

  /** Ghi một mục lịch sử; nuốt lỗi để không chặn thao tác chính */
  private async recordHistory(entry: {
    responseId: number;
    batchId: number;
    action: 'submit' | 'create' | 'update';
    actor: ResponseActor;
    changes: ResponseFieldChange[];
  }): Promise<void> {
    try {
      const row = this.historyRepo.create({
        responseId: entry.responseId,
        batchId: entry.batchId,
        action: entry.action,
        actorId: entry.actor?.id ?? null,
        actorName: entry.actor?.name ?? null,
        changes: entry.changes,
      });
      await this.historyRepo.save(row);
    } catch (e) {
      // Không để lỗi ghi log làm hỏng thao tác thêm/sửa phản hồi
      console.error('[recordHistory] không ghi được lịch sử phản hồi:', e);
    }
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

    const recipients: Array<{ email: string; subject: string; html: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const gs of graduationStudents) {
      const student = gs.student;
      if (!student.email) {
        failed++;
        continue;
      }

      const token = Buffer.from(`${batchId}:${student.code}`).toString('base64');
      const surveyUrl = `${process.env.CLIENT_APP_URL ?? 'http://localhost:5173'}/survey/${batchId}/${this.toSlug(batch.title)}?token=${token}`;

      // Thay thế các biến placeholder trong template trước khi build HTML
      const personalizedBody = emailDto.htmlBody
        .replace(/\{\{ten_nguoi_dung\}\}/g, student.fullName ?? '')
      // thêm các biến khác nếu template có, ví dụ:
      // .replace(/\{\{ma_sv\}\}/g, student.code ?? '')

      const htmlContent = `${personalizedBody}<br><br><a href="${surveyUrl}">Click vào đây để tham gia khảo sát</a>`;

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