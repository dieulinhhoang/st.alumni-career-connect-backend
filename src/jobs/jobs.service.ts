import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Job } from 'src/database/entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ReportsService } from '../reports/reports.service';
import { MailSettingsService } from '../mail-settings/mail-settings.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private reportsService: ReportsService,
    private mailSettingsService: MailSettingsService,
  ) {}

  create(createJobDto: CreateJobDto) {
    // Tin mới luôn ở trạng thái "pending" — phải chờ admin duyệt mới hiển thị công khai.
    const job = this.jobRepository.create({ ...createJobDto, status: undefined });
    return this.jobRepository.save(job);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const title = query.title?.trim();
    const status = query.status?.trim();
    const enterpriseId = query.enterpriseId;

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.enterprise', 'enterprise');

    if (title) {
      qb.andWhere('job.title LIKE :title', { title: `%${title}%` });
    }
    if (status) {
      qb.andWhere('job.status = :status', { status });
    }
    if (enterpriseId) {
      qb.andWhere('job.enterpriseId = :enterpriseId', { enterpriseId });
    }

    qb.orderBy('job.id', 'DESC');
    qb.skip(page * size);
    qb.take(size);

    const [items, total] = await qb.getManyAndCount();
    await this.autoRejectExpiredPending(items);
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  /**
   * Tin đang "pending" (chờ duyệt) mà đã quá hạn nộp coi như bị TỪ CHỐI tự động:
   * admin không cần thao tác, và tin không thể được duyệt sau khi đã hết hạn.
   * Chuyển status -> "rejected" trong DB và phản ánh luôn vào object trả về cho client.
   */
  private async autoRejectExpiredPending(jobs: Job[]) {
    const now = new Date();
    const expired = jobs.filter(
      (j) => j.status === 'pending' && j.deadline && new Date(j.deadline) < now,
    );
    if (expired.length === 0) return;

    await this.jobRepository.update(
      { id: In(expired.map((j) => j.id)) },
      { status: 'rejected', rejectionReason: 'Hết hạn nộp' },
    );
    for (const j of expired) {
      j.status = 'rejected';
      j.rejectionReason = 'Hết hạn nộp';
    }
  }

  async findOne(id: number) {
    const job = await this.jobRepository.findOneBy({ id });
    if (!job) throw new NotFoundException(`Không tìm thấy việc làm #${id}`);
    return job;
  }

  async update(id: number, updateJobDto: UpdateJobDto) {
    await this.findOne(id);
    // "active"/"rejected" chỉ được set qua approve()/reject() — PATCH thường chỉ dùng để
    // đóng tin (closed), đưa tin về chờ duyệt (pending) khi doanh nghiệp sửa nội dung,
    // không cho doanh nghiệp tự duyệt tin của mình.
    const { status, faculty, enterpriseId, ...rest } = updateJobDto as UpdateJobDto & { faculty?: unknown };
    const safeDto = status === 'closed' || status === 'pending' ? { ...rest, status } : rest;
    await this.jobRepository.update({ id }, safeDto);
    return this.jobRepository.findOneBy({ id });
  }

  async approve(id: number) {
    await this.findOne(id);
    await this.jobRepository.update({ id }, { status: 'active', rejectionReason: null });
    return this.jobRepository.findOneBy({ id });
  }

  async reject(id: number, reason?: string) {
    await this.findOne(id);
    await this.jobRepository.update({ id }, { status: 'rejected', rejectionReason: reason ?? null });
    return this.jobRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.jobRepository.softDelete({ id });
  }

  private async getJobWithFaculties(id: number) {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['enterprise', 'jobFaculties'],
    });
    if (!job) throw new NotFoundException(`Không tìm thấy việc làm #${id}`);
    return job;
  }

  /**
   * Xem trước danh sách cựu SV "Chưa có việc làm" theo đợt khảo sát (để admin chọn trước khi gửi).
   * Chỉ lọc theo khoa mà tin tuyển dụng nhắm tới (nếu job có gán khoa); nếu job không gán khoa
   * cụ thể thì trả về toàn bộ cựu SV chưa có việc làm trong đợt.
   */
  async previewUnemployedAlumni(id: number, surveyId?: string) {
    const job = await this.getJobWithFaculties(id);
    return this.previewUnemployedAlumniData(job, surveyId);
  }

  /**
   * Gửi email thông báo tin tuyển dụng cho cựu SV đã khảo sát mà trả lời "Chưa có việc làm"/
   * "Chưa đi tìm việc". Nếu `emails` được truyền (từ danh sách admin đã chọn ở bước xem trước),
   * chỉ gửi cho các email đó; nếu không, gửi cho toàn bộ danh sách khớp filter.
   */
  async notifyUnemployedAlumni(id: number, surveyId?: string, emails?: string[]) {
    const job = await this.getJobWithFaculties(id);
    const { batchTitle, alumni: allAlumni } = await this.previewUnemployedAlumniData(job, surveyId);

    const selectedSet = emails?.length ? new Set(emails.map((e) => e.trim().toLowerCase())) : null;
    const alumni = selectedSet ? allAlumni.filter((a) => selectedSet.has(a.email.trim().toLowerCase())) : allAlumni;

    const results = await Promise.allSettled(
      alumni.map((a) =>
        this.mailSettingsService.sendByTemplate('job_opportunity', a.email, this.buildEmailVars(job, id, a.fullName || a.email)),
      ),
    );

    const sentCount = results.filter((r) => r.status === 'fulfilled').length;
    return {
      batchTitle,
      total: alumni.length,
      sentCount,
      failedCount: alumni.length - sentCount,
    };
  }

  /** Xem trước nội dung email (subject + HTML) sẽ gửi, dùng tên giả lập "Cựu sinh viên" thay cho từng người nhận thật. */
  async previewEmailContent(id: number) {
    const job = await this.getJobWithFaculties(id);
    const template = await this.mailSettingsService.getTemplateByType('job_opportunity');
    if (!template) throw new NotFoundException('Không tìm thấy template email "job_opportunity"');

    const vars = this.buildEmailVars(job, id, 'Cựu sinh viên');
    const subject = (template.subject || '').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    const html = this.mailSettingsService.renderHtml(template, vars);
    return { subject, html };
  }

  private buildEmailVars(job: Job, id: number, recipientName: string): Record<string, string> {
    const jobUrl = `${process.env.CLIENT_APP_URL ?? ''}/jobs?jobId=${id}`;
    return {
      ten_nguoi_dung: recipientName,
      ten_viec: job.title,
      ten_doanh_nghiep: job.enterprise?.name ?? '',
      dia_diem: job.location ?? '',
      luong: job.salary ?? 'Thỏa thuận',
      button_url: jobUrl,
    };
  }

  private async previewUnemployedAlumniData(job: Job, surveyId?: string) {
    const facultyIds = (job.jobFaculties ?? []).map((jf) => jf.facultyId);
    return this.reportsService.getUnemployedAlumni({
      surveyId,
      facultyIds: facultyIds.length ? facultyIds : undefined,
    });
  }
}
