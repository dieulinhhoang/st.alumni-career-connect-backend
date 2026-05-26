import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  formId?: number;

  @IsOptional()
  formSnapshot?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  graduationPeriod?: string;

  @IsOptional()
  @IsNumber()
  totalStudents?: number;
}
