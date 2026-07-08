import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceConfig } from 'src/database/entities/service-config.entity';

const DEFAULT_CONFIGS: { key: string; description: string }[] = [
  { key: 'geoapify_api_key', description: 'API key cho Geoapify Geocoder (địa chỉ)' },
];

@Injectable()
export class ServiceConfigService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ServiceConfig)
    private repo: Repository<ServiceConfig>,
  ) {}

  async onApplicationBootstrap() {
    for (const cfg of DEFAULT_CONFIGS) {
      const exists = await this.repo.findOne({ where: { key: cfg.key } });
      if (!exists) {
        await this.repo.save(this.repo.create({ key: cfg.key, value: null, description: cfg.description }));
      }
    }
  }

  async getAll(): Promise<ServiceConfig[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async getByKey(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? null;
  }

  async upsert(key: string, value: string, description?: string): Promise<ServiceConfig> {
    let row = await this.repo.findOne({ where: { key } });
    if (row) {
      row.value = value;
      if (description !== undefined) row.description = description;
    } else {
      row = this.repo.create({ key, value, description: description ?? null });
    }
    return this.repo.save(row);
  }
}
