import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBatchDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // id là cột bigint → API/FE trả về dạng chuỗi ("103"). @Type ép về number
  // trước khi @IsNumber chạy, tránh 400 "must be a number".
  @Type(() => Number)
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

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  graduationPeriod?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  graduationId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  totalStudents?: number;
}