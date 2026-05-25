import { Module } from '@nestjs/common';
import { SurveyBatchesController } from './survey-batches.controller';
import { SurveyBatchesService } from './survey-batches.service';

@Module({
  controllers: [SurveyBatchesController],
  providers: [SurveyBatchesService],
})
export class SurveyBatchesModule {}
