import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniController } from './alumni.controller';
import { AlumniService } from './alumni.service';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { SurveyResponse } from '../database/entities/survey-response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlumniBatch, SurveyResponse])],
  controllers: [AlumniController],
  providers: [AlumniService],
})
export class AlumniModule {}
