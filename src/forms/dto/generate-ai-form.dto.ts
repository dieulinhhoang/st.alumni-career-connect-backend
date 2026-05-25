import { IsString } from 'class-validator';

export class GenerateAIFormDto {
  @IsString()
  prompt: string;
}
