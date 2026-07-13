import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceConfig } from 'src/database/entities/service-config.entity';

const DEFAULT_CONFIGS: { key: string; description: string }[] = [
  { key: 'geoapify_api_key', description: 'API key cho Geoapify Geocoder (địa chỉ)' },
  { key: 'google_maps_api_key', description: 'API key cho Google Maps Places (gợi ý địa chỉ + tách tỉnh/thành)' },
  { key: 'goong_api_key', description: 'API key cho Goong.io (gợi ý địa chỉ Việt Nam + tách tỉnh/thành)' },
  { key: 'address_provider', description: 'Nhà cung cấp gợi ý địa chỉ đang dùng: google | geoapify | goong | none (không dùng key, nhập tay)' },
];

// Các key được phép đọc công khai (không cần đăng nhập) — dùng cho form khảo sát công khai.
// Các API key địa chỉ vốn để lộ ở client (phải giới hạn theo HTTP referrer / domain).
// address_provider cần công khai để form public biết dùng nhà cung cấp nào.
export const PUBLIC_CONFIG_KEYS = new Set<string>([
  'google_maps_api_key',
  'geoapify_api_key',
  'goong_api_key',
  'address_provider',
]);

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
