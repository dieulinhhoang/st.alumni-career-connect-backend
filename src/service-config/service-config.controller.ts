import { Body, Controller, ForbiddenException, Get, Param, Put, UseGuards } from '@nestjs/common';
import { PUBLIC_CONFIG_KEYS, ServiceConfigService } from './service-config.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('service-config')
@UseGuards(JwtAuthGuard)
export class ServiceConfigController {
  constructor(private readonly service: ServiceConfigService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  /**
   * Đọc key công khai cho form khảo sát (respondent chưa đăng nhập).
   * Chỉ trả về các key nằm trong whitelist PUBLIC_CONFIG_KEYS.
   */
  @Public()
  @Get('public/:key')
  async getPublicByKey(@Param('key') key: string) {
    if (!PUBLIC_CONFIG_KEYS.has(key)) {
      throw new ForbiddenException('Key không được phép truy cập công khai');
    }
    const value = await this.service.getByKey(key);
    return { key, value };
  }

  @Get(':key')
  async getByKey(@Param('key') key: string) {
    const value = await this.service.getByKey(key);
    return { key, value };
  }

  @Put(':key')
  upsert(@Param('key') key: string, @Body() body: { value: string; description?: string }) {
    return this.service.upsert(key, body.value, body.description);
  }
}
