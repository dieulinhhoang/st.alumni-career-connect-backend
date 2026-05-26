import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  formId: number;

  @IsOptional()
  formSnapshot?: any;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  year: number;

  @IsString()
  graduationPeriod: string;

  @IsOptional()
  @IsNumber()
  totalStudents?: number;
}
