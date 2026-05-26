import { IsString, IsOptional, IsNumber } from 'class-validator';

export class GenerateAiFormDto {
  @IsString()
  topic: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsNumber()
  @IsOptional()
  questionCount?: number;

  @IsString()
  @IsOptional()
  context?: string;
}
