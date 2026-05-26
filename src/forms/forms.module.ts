import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { Survey } from 'src/database/entities/survey.entity';
import { SurveyQuestion } from 'src/database/entities/survey-question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveyQuestion])],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
