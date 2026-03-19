import { Injectable } from '@nestjs/common';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { Survey } from 'src/database/survey.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class SurveysService {
  constructor(private manager: EntityManager) {}

  create(createSurveyDto: CreateSurveyDto) {
    return 'This action adds a new survey';
  }

  async findAll() {
    return await this.manager.find(Survey);
  }
 

  update(id: number, updateSurveyDto: UpdateSurveyDto) {
    return `This action updates a #${id} survey`;
  }

  remove(id: number) {
    return `This action removes a #${id} survey`;
  }
}
