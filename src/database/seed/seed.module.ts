import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Major } from '../major.entity';
import { User } from '../user.entity';
import { Role } from '../role.entity';
import { Permission } from '../permission.entity';
import { SurveyResponse } from '../survey-response.entity';
import { SurveyAnswer } from '../survey-answer.entity';
import { SurveyQuestion } from '../survey-question.entity';
import { Survey } from '../survey.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Survey, 
      SurveyQuestion, 
      SurveyResponse, 
      SurveyAnswer,
      Major, 
      User, 
      Role, 
      Permission]),
  ],
  providers: [SeedService],
})
export class SeedModule {}