import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsNumber()
  enterpriseId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsIn(['pending', 'active', 'closed', 'rejected'])
  status?: 'pending' | 'active' | 'closed' | 'rejected';
}
