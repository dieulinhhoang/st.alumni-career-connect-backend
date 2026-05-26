import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'src/database/entities/job.entity';

@Injectable()
export class JobPostingsService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
  ) {}

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 20);

    const qb = this.jobRepo
      .createQueryBuilder('j')
      .leftJoin('j.enterprise', 'e')
      .select([
        'j.id',
        'j.title',
        'j.location',
        'j.salaryRange',
        'j.tags',
        'j.postedAt',
        'j.deadline',
        'j.status',
        'e.id',
        'e.name',
      ]);

    if (query.search) {
      qb.andWhere('j.title LIKE :search', { search: `%${query.search}%` });
    }
    if (query.enterpriseId) {
      qb.andWhere('e.id = :eid', { eid: query.enterpriseId });
    }

    qb.orderBy('j.id', 'DESC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();

    const postings = items.map(j => ({
      id: String(j.id),
      enterpriseId: String((j as any).enterprise?.id ?? ''),
      enterpriseName: (j as any).enterprise?.name ?? '',
      title: j.title,
      location: j.location,
      salaryRange: j.salaryRange,
      tags: j.tags ?? [],
      postedAt: j.postedAt,
      deadline: j.deadline ?? undefined,
    }));

    return { items: postings, page, size, total, totalPages: Math.ceil(total / size) };
  }
}
