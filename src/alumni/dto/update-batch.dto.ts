import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { BatchStatus } from '../../database/entities/alumni-batch.entity';

export class UpdateBatchDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['draft', 'active', 'ended'])
  @IsOptional()
  status?: BatchStatus;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  formSnapshot?: Record<string, any>;

  @IsInt()
  @IsOptional()
  totalStudents?: number;
}
