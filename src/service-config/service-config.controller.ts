import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ServiceConfigService } from './service-config.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('service-config')
@UseGuards(JwtAuthGuard)
export class ServiceConfigController {
  constructor(private readonly service: ServiceConfigService) {}

  @Get()
  getAll() {
    return this.service.getAll();
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
