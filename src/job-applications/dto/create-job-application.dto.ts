import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJobApplicationDto {
  @IsNotEmpty()
  jobId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fullName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  phone: string;

  @IsOptional()
  @IsString()
  message?: string;
}
