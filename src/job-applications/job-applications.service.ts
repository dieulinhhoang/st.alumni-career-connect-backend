import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobApplication } from 'src/database/entities/job-application.entity';
import { Job } from 'src/database/entities/job.entity';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class JobApplicationsService {
  constructor(
    @InjectRepository(JobApplication)
    private applicationRepo: Repository<JobApplication>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    private mailService: MailService,
  ) {}

  async create(dto: CreateJobApplicationDto) {
    const job = await this.jobRepo.findOne({
      where: { id: dto.jobId },
      relations: ['enterprise'],
    });
    if (!job) throw new NotFoundException(`Không tìm thấy việc làm #${dto.jobId}`);

    const application = this.applicationRepo.create({
      jobId: dto.jobId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      message: dto.message,
    });

    const saved = await this.applicationRepo.save(application);

    // Gửi email thông báo cho doanh nghiệp (fire-and-forget)
    const enterpriseEmail = (job as any).enterprise?.email;
    if (enterpriseEmail) {
      this.mailService
        .sendApplicationNotification(enterpriseEmail, job.title, dto.fullName, dto.email, dto.phone, dto.message)
        .catch(() => {});
    }

    return saved;
  }

  async findByJob(jobId: number, query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 20);

    const [items, total] = await this.applicationRepo.findAndCount({
      where: { jobId },
      order: { appliedAt: 'DESC' },
      skip: page * size,
      take: size,
    });

    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findByEnterprise(enterpriseId: number, query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 20);

    const qb = this.applicationRepo
      .createQueryBuilder('a')
      .innerJoin('a.job', 'j')
      .innerJoin('j.enterprise', 'e')
      .where('e.id = :enterpriseId', { enterpriseId })
      .select([
        'a.id', 'a.fullName', 'a.email', 'a.phone',
        'a.message', 'a.appliedAt', 'a.status',
        'j.id', 'j.title',
      ])
      .orderBy('a.appliedAt', 'DESC')
      .skip(page * size)
      .take(size);

    if (query.jobId) {
      qb.andWhere('j.id = :jobId', { jobId: Number(query.jobId) });
    }

    if (query.status) {
      qb.andWhere('a.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async updateStatus(id: number, dto: UpdateJobApplicationDto) {
    const app = await this.applicationRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException(`Không tìm thấy hồ sơ #${id}`);
    app.status = dto.status;
    return this.applicationRepo.save(app);
  }
}
