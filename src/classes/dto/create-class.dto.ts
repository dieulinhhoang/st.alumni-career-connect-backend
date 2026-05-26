import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsNumber()
  khoa: number;

  @IsOptional() @IsString()
  advisor?: string;

  @IsOptional() @IsNumber()
  students?: number;

  @IsOptional() @IsNumber()
  majorId?: number;
}
