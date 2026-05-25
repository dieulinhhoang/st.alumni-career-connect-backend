import { PartialType } from '@nestjs/mapped-types';
import { CreateAlumniDto } from './create-alumni.dto';
export class UpdateAlumniDto extends PartialType(CreateAlumniDto) {}
