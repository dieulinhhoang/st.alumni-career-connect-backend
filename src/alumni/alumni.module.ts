import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniResponse } from 'src/database/entities/alumni-response.entity';
import { AlumniController } from './alumni.controller';
import { AlumniService } from './alumni.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlumniBatch, AlumniResponse])],
  controllers: [AlumniController],
  providers: [AlumniService],
  exports: [AlumniService],
})
export class AlumniModule {}
