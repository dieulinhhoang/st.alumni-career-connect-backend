import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { AlumniProfile } from '../database/entities/alumni-profile.entity';
import { ApiKey } from '../database/entities/api-key.entity';

// ─── API key management ───────────────────────────────────────────────────────

export interface CreateApiKeyDto {
  name: string;
  description?: string;
}

export interface ApiKeyListItem {
  id: number;
  name: string;
  keySuffix: string;
  isActive: boolean;
  description: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

// ─── Alumni career query ──────────────────────────────────────────────────────

export interface AlumniCareerItem {
  studentCode: string;
  fullName: string;
  email: string;
  phone: string;
  major: string;
  graduationYear: number | null;
  occupationSector: string;
  company: string;
  position: string;
  workLocation: string;
}

export interface GetAlumniCareerOptions {
  studentCode?: string;
  major?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ExternalApiService {
  constructor(
    @InjectRepository(AlumniProfile)
    private profileRepo: Repository<AlumniProfile>,

    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
  ) {}

  // ─── API key management ─────────────────────────────────────────────────────

  async createApiKey(dto: CreateApiKeyDto): Promise<{ id: number; key: string }> {
    const raw = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    const suffix = raw.slice(-8);

    const entity = this.apiKeyRepo.create({
      name: dto.name,
      description: dto.description ?? undefined,
      keyHash: hash,
      keySuffix: suffix,
      isActive: true,
    });

    const saved = await this.apiKeyRepo.save(entity);
    return { id: saved.id, key: raw };
  }

  async listApiKeys(): Promise<ApiKeyListItem[]> {
    const keys = await this.apiKeyRepo.find({ order: { createdAt: 'DESC' } });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keySuffix: k.keySuffix,
      isActive: k.isActive,
      description: k.description ?? null,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));
  }

  async revokeApiKey(id: number): Promise<void> {
    const key = await this.apiKeyRepo.findOne({ where: { id } });
    if (!key) throw new NotFoundException(`API key #${id} không tồn tại`);
    await this.apiKeyRepo.update(id, { isActive: false });
  }

  async deleteApiKey(id: number): Promise<void> {
    const key = await this.apiKeyRepo.findOne({ where: { id } });
    if (!key) throw new NotFoundException(`API key #${id} không tồn tại`);
    await this.apiKeyRepo.delete(id);
  }

  // ─── Alumni career data (query thẳng alumni_profiles) ───────────────────────

  async getAlumniCareer(opts: GetAlumniCareerOptions) {
    const page  = Math.max(1, opts.page  ?? 1);
    const limit = Math.min(500, Math.max(1, opts.limit ?? 100));

    const qb = this.profileRepo.createQueryBuilder('p');

    if (opts.studentCode) {
      qb.andWhere('p.studentCode = :code', { code: opts.studentCode });
    }
    if (opts.major) {
      qb.andWhere('p.major LIKE :major', { major: `%${opts.major}%` });
    }

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('p.studentCode', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data: AlumniCareerItem[] = rows.map((p) => ({
      studentCode:      p.studentCode,
      fullName:         p.fullName ?? '',
      email:            p.email ?? '',
      phone:            p.phone ?? '',
      major:            p.major ?? '',
      graduationYear:   p.graduationYear ?? null,
      occupationSector: p.occupationSector ?? '',
      company:          p.currentCompany ?? '',
      position:         p.currentPosition ?? '',
      workLocation:     p.workLocation ?? '',
    }));

    return { total, page, limit, data };
  }

  async getAlumniCareerByCode(studentCode: string): Promise<AlumniCareerItem | null> {
    const p = await this.profileRepo.findOne({ where: { studentCode } });
    if (!p) return null;

    return {
      studentCode:      p.studentCode,
      fullName:         p.fullName ?? '',
      email:            p.email ?? '',
      phone:            p.phone ?? '',
      major:            p.major ?? '',
      graduationYear:   p.graduationYear ?? null,
      occupationSector: p.occupationSector ?? '',
      company:          p.currentCompany ?? '',
      position:         p.currentPosition ?? '',
      workLocation:     p.workLocation ?? '',
    };
  }
}
