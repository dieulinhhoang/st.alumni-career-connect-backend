import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  formId: number;

  @IsOptional()
  formSnapshot?: Record<string, any>;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  graduationPeriod?: string;

  @IsInt()
  @IsOptional()
  totalStudents?: number;
}
