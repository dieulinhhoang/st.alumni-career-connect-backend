import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  sections?: object[];

  @IsArray()
  @IsOptional()
  questions?: object[];

  @IsString()
  @IsOptional()
  themeId?: string;

  @IsOptional()
  header?: object;

  @IsOptional()
  footer?: object;

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: 'draft' | 'published';
}
