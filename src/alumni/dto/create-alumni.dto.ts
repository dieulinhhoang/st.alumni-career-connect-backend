import { IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';

export class CreateAlumniDto {
  @IsString()
  studentCode: string;

  @IsString()
  fullName: string;

  @IsOptional() @IsString()
  major?: string;

  @IsOptional() @IsNumber()
  graduationYear?: number;

  @IsOptional() @IsString()
  currentPosition?: string;

  @IsOptional() @IsString()
  currentCompany?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  linkedIn?: string;

  @IsOptional() @IsString()
  bio?: string;
}
