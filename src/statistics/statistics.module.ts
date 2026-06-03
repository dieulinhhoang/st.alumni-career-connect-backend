import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlumniBatch, AlumniBatchResponse])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}