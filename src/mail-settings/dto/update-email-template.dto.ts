import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsObject()
  sections?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
