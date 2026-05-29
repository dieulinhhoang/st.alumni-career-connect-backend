import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { EnterpriseFaculty } from 'src/database/entities/enterprise-faculty.entity';

@Injectable()
export class EnterprisesService {
  constructor(
    @InjectRepository(Enterprise)
    private enterpriseRepository: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(EnterpriseFaculty)
    private enterpriseFacultyRepository: Repository<EnterpriseFaculty>,
  ) { }

   async create(createEnterpriseDto: CreateEnterpriseDto) {
  const { faculties = [], ...enterpriseData } = createEnterpriseDto;

  const enterprise = await this.enterpriseRepository.save(
    this.enterpriseRepository.create(enterpriseData),
  );

  if (faculties.length > 0) {
    const rows = faculties.map((facultyId) =>
      this.enterpriseFacultyRepository.create({
        enterpriseId: enterprise.id,
        facultyId,
      }),
    );

    await this.enterpriseFacultyRepository.save(rows);
  }

  return this.findOne(enterprise.id);
}

 async findAll(query: any) {
  const page = Number(query.page ?? 0);
  const size = Number(query.size ?? 10);
  const name = query.name?.trim();
  const industry = query.industry?.trim();
  const partnerStatus = query.partnerStatus?.trim();
  const facultyId = query.facultyId ? Number(query.facultyId) : undefined;

  const qb = this.enterpriseRepository.createQueryBuilder('enterprise');

  const jobCountSub = this.jobRepository
    .createQueryBuilder('job')
    .select('COUNT(*)')
    .where('job.enterpriseId = enterprise.id');

  qb.addSelect(`(${jobCountSub.getQuery()})`, 'jobCount');

  if (name) {
    qb.andWhere('enterprise.name LIKE :name', { name: `%${name}%` });
  }
  if (industry) {
    qb.andWhere('enterprise.industry LIKE :industry', { industry: `%${industry}%` });
  }
  if (partnerStatus) {
    qb.andWhere('enterprise.partnerStatus = :partnerStatus', { partnerStatus });
  }
  if (facultyId) {
    qb.innerJoin(
      'enterprise.enterpriseFaculties',
      'ef',
      'ef.facultyId = :facultyId',
      { facultyId },
    );
  }

  qb.orderBy('enterprise.id', 'DESC');
  qb.skip(page * size);
  qb.take(size);

  const { entities, raw } = await qb.getRawAndEntities();
  const total = await qb.getCount();

  const items = entities.map((enterprise, index) => ({
    ...enterprise,
    jobs: Number(raw[index]?.jobCount ?? 0),
  }));

  return {
    items,
    page,
    size,
    total,
    totalPages: Math.ceil(total / size),
  };
  }

 async findOne(id: number) {
  const enterprise = await this.enterpriseRepository.findOne({
    where: { id },
    relations: {
      enterpriseFaculties: {
        faculty: true,
      },
    },
  });

  if (!enterprise) {
    throw new NotFoundException(`Không tìm thấy doanh nghiệp #${id}`);
  }

  return {
    ...enterprise,
    faculties: enterprise.enterpriseFaculties.map((ef) => ({
      id: ef.faculty.id,
      name: ef.faculty.name,
      color: ef.faculty.color,
    })),
  };
}

 async update(id: number, updateEnterpriseDto: UpdateEnterpriseDto) {
  await this.findOne(id);

  const { faculties, faculty, ...enterpriseData } = updateEnterpriseDto as any;

  await this.enterpriseRepository.update({ id }, enterpriseData);

  if (faculties !== undefined) {
    await this.enterpriseFacultyRepository.delete({ enterpriseId: id });

    if (Array.isArray(faculties) && faculties.length > 0) {
      const rows = faculties.map((facultyId: number) =>
        this.enterpriseFacultyRepository.create({
          enterpriseId: id,
          facultyId,
        }),
      );

      await this.enterpriseFacultyRepository.save(rows);
    }
  }

  return this.findOne(id);
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
