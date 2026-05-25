import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateFormDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  sections?: object[];

  @IsOptional()
  @IsArray()
  questions?: object[];

  @IsOptional()
  @IsString()
  themeId?: string;

  @IsOptional()
  header?: object;

  @IsOptional()
  footer?: object;

  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published';
}
