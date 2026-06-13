import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ConfirmBatchInfoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  year: number;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  graduationName: string;
}

export class NewMajorDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  facultyId?: number;
}

export class MajorGroupDecisionDto {
  @IsString()
  oldCode: string;

  @IsString()
  industryName: string;

  @IsOptional()
  @IsInt()
  matchedMajorId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewMajorDto)
  newMajor?: NewMajorDto;
}

export class ConfirmImportDto {
  @IsInt()
  formId: number;

  @ValidateNested()
  @Type(() => ConfirmBatchInfoDto)
  batch: ConfirmBatchInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MajorGroupDecisionDto)
  majorGroups: MajorGroupDecisionDto[];

  @IsArray()
  roster: any[];

  @IsArray()
  responses: any[];
}
