import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { FormEntity } from 'src/database/entities/form.entity';
import { AlumniBatchesService } from './alumni-batches.service';
import { AlumniBatchesController } from './alumni-batches.controller';
import { Student } from 'src/database/entities/student.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { EmailService } from './email.service';
import { SurveysModule } from 'src/surveys/surveys.module';
import { AlumniProfile } from 'src/database/entities/alumni-profile.entity';
import { AlumniProfileSyncService } from './alumni-profile-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlumniBatch, AlumniBatchResponse, FormEntity,
      Student, GraduationStudent, AlumniProfile,
    ]),
    SurveysModule,
  ],
  controllers: [AlumniBatchesController],
  providers: [AlumniBatchesService, EmailService, AlumniProfileSyncService],
  exports: [AlumniBatchesService],
})
export class AlumniBatchesModule {}
