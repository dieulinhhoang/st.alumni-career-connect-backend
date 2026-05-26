import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyBatchesController } from './survey-batches.controller';
import { SurveyBatchesService } from './survey-batches.service';
import { SurveyBatch } from 'src/database/entities/survey-batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyBatch])],
  controllers: [SurveyBatchesController],
  providers: [SurveyBatchesService],
})
export class SurveyBatchesModule {}
