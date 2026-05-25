import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'src/database/entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  create(createJobDto: CreateJobDto) {
    const job = this.jobRepository.create(createJobDto);
    return this.jobRepository.save(job);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const title = query.title?.trim();
    const status = query.status?.trim();
    const enterpriseId = query.enterpriseId;

    const qb = this.jobRepository.createQueryBuilder('job');

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
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number) {
    const job = await this.jobRepository.findOneBy({ id });
    if (!job) throw new NotFoundException(`Không tìm thấy việc làm #${id}`);
    return job;
  }

  async update(id: number, updateJobDto: UpdateJobDto) {
    await this.findOne(id);
    await this.jobRepository.update({ id }, updateJobDto);
    return this.jobRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.jobRepository.softDelete({ id });
  }
}
