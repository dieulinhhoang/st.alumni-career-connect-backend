import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { GraduationController } from './graduation.controller';
import { GraduationService } from './graduation.service';
import { StudentApiService } from './student-api.service';
import { Graduation } from 'src/database/entities/graduation.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { Student } from 'src/database/entities/student.entity';
import { Major } from 'src/database/entities/major.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { User } from 'src/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Graduation, GraduationStudent, Student, Major, Faculty, User]),
    HttpModule,
  ],
  controllers: [GraduationController],
  providers: [GraduationService, StudentApiService],
  exports: [GraduationService],
})
export class GraduationModule {}
