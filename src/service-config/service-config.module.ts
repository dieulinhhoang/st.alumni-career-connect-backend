import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceConfig } from 'src/database/entities/service-config.entity';
import { ServiceConfigService } from './service-config.service';
import { ServiceConfigController } from './service-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceConfig])],
  controllers: [ServiceConfigController],
  providers: [ServiceConfigService],
  exports: [ServiceConfigService],
})
export class ServiceConfigModule {}
