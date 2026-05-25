import { PartialType } from '@nestjs/mapped-types';
import { CreateGraduationDto } from './create-graduation.dto';

export class UpdateGraduationDto extends PartialType(CreateGraduationDto) {}
