import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

@Injectable()
export class EnterprisesService {
  constructor(
    @InjectRepository(Enterprise)
    private enterpriseRepository: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  create(createEnterpriseDto: CreateEnterpriseDto) {
    const enterprise = this.enterpriseRepository.create(createEnterpriseDto);
    return this.enterpriseRepository.save(enterprise);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const name = query.name?.trim();
    const industry = query.industry?.trim();
    const partnerStatus = query.partnerStatus?.trim();

    const qb = this.enterpriseRepository.createQueryBuilder('enterprise');

    if (name) {
      qb.andWhere('enterprise.name LIKE :name', { name: `%${name}%` });
    }
    if (industry) {
      qb.andWhere('enterprise.industry LIKE :industry', { industry: `%${industry}%` });
    }
    if (partnerStatus) {
      qb.andWhere('enterprise.partnerStatus = :partnerStatus', { partnerStatus });
    }

    qb.orderBy('enterprise.id', 'DESC');
    qb.skip(page * size);
    qb.take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number) {
    const enterprise = await this.enterpriseRepository.findOneBy({ id });
    if (!enterprise) throw new NotFoundException(`Không tìm thấy doanh nghiệp #${id}`);
    return enterprise;
  }

  async update(id: number, updateEnterpriseDto: UpdateEnterpriseDto) {
    await this.findOne(id);
    await this.enterpriseRepository.update({ id }, updateEnterpriseDto);
    return this.enterpriseRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.enterpriseRepository.softDelete({ id });
  }

  async verify(id: number) {
    await this.findOne(id);
    await this.enterpriseRepository.update({ id }, { verified: 1 });
    return this.enterpriseRepository.findOneBy({ id });
  }

  async setPartnerStatus(id: number, status: 'active' | 'inactive') {
    await this.findOne(id);
    await this.enterpriseRepository.update({ id }, { partnerStatus: status });
    return this.enterpriseRepository.findOneBy({ id });
  }

  async getJobs(enterpriseId: number, query: any) {
    await this.findOne(enterpriseId);
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);

    const qb = this.jobRepository.createQueryBuilder('job')
      .where('job.enterpriseId = :enterpriseId', { enterpriseId })
      .orderBy('job.id', 'DESC')
      .skip(page * size)
      .take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }
}
