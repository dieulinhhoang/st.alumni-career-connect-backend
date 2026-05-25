import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ReportType, ReportStatus } from 'src/database/entities/report.entity';

export class CreateReportDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
