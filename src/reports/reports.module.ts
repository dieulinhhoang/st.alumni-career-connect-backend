import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Graduation } from 'src/database/entities/graduation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Faculty, Graduation])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
