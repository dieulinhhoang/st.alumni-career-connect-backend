import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ApiKey } from '../../database/entities/api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers['x-api-key'] ?? request.headers['authorization'];
    if (!header) throw new UnauthorizedException('Thiếu API key');

    const raw = header.startsWith('Bearer ') ? header.slice(7) : header;
    const hash = createHash('sha256').update(raw).digest('hex');

    const key = await this.apiKeyRepo.findOne({ where: { keyHash: hash, isActive: true } });
    if (!key) throw new UnauthorizedException('API key không hợp lệ hoặc đã bị thu hồi');

    // Cập nhật lastUsedAt không blocking
    this.apiKeyRepo.update(key.id, { lastUsedAt: new Date() }).catch(() => {});
    return true;
  }
}
