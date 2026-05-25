import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Graduation } from 'src/database/entities/graduation.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Faculty, Graduation, GraduationStudent])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
