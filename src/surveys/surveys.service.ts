import { Injectable } from '@nestjs/common';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';

@Injectable()
export class SurveysService {
  create(createSurveyDto: CreateSurveyDto) {
    return 'This action adds a new survey';
  }

  findAll() {
    const surveys = this.findAll();
    return surveys;
  }

  findOne(id: number) {
    const survey = this.findOne(id);
    return  survey;
  }

  update(id: number, updateSurveyDto: UpdateSurveyDto) {
    return `This action updates a #${id} survey`;
  }

  remove(id: number) {
    return `This action removes a #${id} survey`;
  }
}
