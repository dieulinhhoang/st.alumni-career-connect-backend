import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraduationController } from './graduation.controller';
import { GraduationService } from './graduation.service';
import { Graduation } from 'src/database/entities/graduation.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { Student } from 'src/database/entities/student.entity';
import { Major } from 'src/database/entities/major.entity';
import { Faculty } from 'src/database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Graduation, GraduationStudent, Student, Major , Faculty])],
  controllers: [GraduationController],
  providers: [GraduationService],
  exports: [GraduationService],
})
export class GraduationModule {}
