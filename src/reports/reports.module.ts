import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from 'src/database/entities/report.entity';
import { ReportTemplate } from 'src/database/entities/report-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportTemplate])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
