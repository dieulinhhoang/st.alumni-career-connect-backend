import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'ended'])
  status?: 'draft' | 'active' | 'ended';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  formSnapshot?: any;

  @IsOptional()
  @IsNumber()
  totalStudents?: number;
}
