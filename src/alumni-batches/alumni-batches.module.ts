import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { FormEntity } from 'src/database/entities/form.entity';
import { AlumniBatchesService } from './alumni-batches.service';
import { AlumniBatchesController } from './alumni-batches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AlumniBatch, AlumniBatchResponse, FormEntity])],
  controllers: [AlumniBatchesController],
  providers: [AlumniBatchesService],
  exports: [AlumniBatchesService],
})
export class AlumniBatchesModule {}