import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveyBatchDto } from './create-survey-batch.dto';

export class UpdateSurveyBatchDto extends PartialType(CreateSurveyBatchDto) {}
