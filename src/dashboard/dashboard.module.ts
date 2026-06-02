import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';
import { SurveyQuestion } from 'src/database/entities/survey-question.entity';
import { SurveyAnswer } from 'src/database/entities/survey-answer.entity';
import { SurveyResponse } from 'src/database/entities/survey-response.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Faculty,
      Major,
      SurveyQuestion,
      SurveyAnswer,
      SurveyResponse,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
