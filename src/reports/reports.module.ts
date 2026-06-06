import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Faculty } from '../database/entities/faculty.entity';
import { Major } from '../database/entities/major.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlumniBatch, AlumniBatchResponse, Faculty, Major]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}