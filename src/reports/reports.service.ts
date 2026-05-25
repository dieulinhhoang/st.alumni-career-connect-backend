import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from 'src/database/entities/report.entity';
import { ReportTemplate } from 'src/database/entities/report-template.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { CreateReportTemplateDto } from './dto/create-report-template.dto';
import { UpdateReportTemplateDto } from './dto/update-report-template.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepo: Repository<Report>,
    @InjectRepository(ReportTemplate)
    private templateRepo: Repository<ReportTemplate>,
  ) {}

  // ---- Reports ----
  async createReport(dto: CreateReportDto) {
    const report = this.reportRepo.create(dto);
    return this.reportRepo.save(report);
  }

  async findAllReports(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const qb = this.reportRepo.createQueryBuilder('r');
    if (query.type) qb.andWhere('r.type = :type', { type: query.type });
    if (query.status) qb.andWhere('r.status = :status', { status: query.status });
    if (query.keyword) qb.andWhere('r.title LIKE :kw', { kw: `%${query.keyword}%` });
    qb.orderBy('r.createdAt', 'DESC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOneReport(id: string) {
    const r = await this.reportRepo.findOneBy({ id });
    if (!r) throw new NotFoundException(`Không tìm thấy báo cáo #${id}`);
    return r;
  }

  async updateReport(id: string, dto: UpdateReportDto) {
    await this.findOneReport(id);
    await this.reportRepo.update(id, dto);
    return this.reportRepo.findOneBy({ id });
  }

  async removeReport(id: string) {
    await this.findOneReport(id);
    return this.reportRepo.softDelete(id);
  }

  // ---- Templates ----
  async createTemplate(dto: CreateReportTemplateDto) {
    const t = this.templateRepo.create(dto);
    return this.templateRepo.save(t);
  }

  async findAllTemplates(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const [items, total] = await this.templateRepo.findAndCount({
      where: { isActive: true },
      skip: page * size,
      take: size,
      order: { createdAt: 'DESC' },
    });
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOneTemplate(id: string) {
    const t = await this.templateRepo.findOneBy({ id });
    if (!t) throw new NotFoundException(`Không tìm thấy template #${id}`);
    return t;
  }

  async updateTemplate(id: string, dto: UpdateReportTemplateDto) {
    await this.findOneTemplate(id);
    await this.templateRepo.update(id, dto);
    return this.templateRepo.findOneBy({ id });
  }

  async removeTemplate(id: string) {
    await this.findOneTemplate(id);
    return this.templateRepo.softDelete(id);
  }
}
