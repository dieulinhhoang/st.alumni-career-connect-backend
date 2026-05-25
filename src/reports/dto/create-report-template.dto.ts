import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateReportTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  schema?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
