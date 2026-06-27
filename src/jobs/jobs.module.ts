import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from 'src/database/entities/job.entity';
import { ReportsModule } from '../reports/reports.module';
import { MailSettingsModule } from '../mail-settings/mail-settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), ReportsModule, MailSettingsModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
