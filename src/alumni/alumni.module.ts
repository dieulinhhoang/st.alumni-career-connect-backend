import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { Survey } from '../database/entities/survey.entity';
import { AlumniController } from './alumni.controller';
import { AlumniService } from './alumni.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlumniBatch, Survey])],
  controllers: [AlumniController],
  providers: [AlumniService],
  exports: [AlumniService],
})
export class AlumniModule {}
