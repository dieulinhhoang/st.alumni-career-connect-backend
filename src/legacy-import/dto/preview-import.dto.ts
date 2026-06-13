import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class PreviewImportDto {
  @Type(() => Number)
  @IsInt()
  formId: number;
}
