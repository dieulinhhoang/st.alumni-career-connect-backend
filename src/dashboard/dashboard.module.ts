import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from 'src/database/entities/user.entity';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Survey } from 'src/database/entities/survey.entity';
import { SurveyQuestion } from 'src/database/entities/survey-question.entity';
import { SurveyAnswer } from 'src/database/entities/survey-answer.entity';
import { SurveyResponse } from 'src/database/entities/survey-response.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';
import { Graduation } from 'src/database/entities/graduation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      Enterprise,
      Job,
      Survey,
      SurveyQuestion,
      SurveyAnswer,
      SurveyResponse,
      Faculty,
      Major,
      Graduation,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
