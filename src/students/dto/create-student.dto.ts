import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @Length(1, 50)
  code: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @IsOptional()
  @IsString()
  @Length(1, 20)
  citizenIdentification?: string;

  @IsOptional()
  @IsDateString()
  citizenIdentificationIssueDate?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  citizenIdentificationIssuePlace?: string;

  @IsOptional()
  trainingIndustryId?: number;

  @IsOptional()
  @IsString()
  schoolYearEnd?: string;
}
