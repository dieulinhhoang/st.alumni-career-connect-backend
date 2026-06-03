import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  formId: number;

  @IsEnum(['draft', 'active', 'ended'])
  @IsOptional()
  status?: 'draft' | 'active' | 'ended';

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  graduationPeriod?: string;

  @IsNumber()
  @IsOptional()
  graduationId?: number;

  @IsNumber()
  @IsOptional()
  totalStudents?: number;
}