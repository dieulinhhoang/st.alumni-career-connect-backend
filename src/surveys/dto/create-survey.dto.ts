import { IsString, IsOptional, IsArray, IsEnum, ValidateNested, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionOptionDto {
  @IsString()
  id: string;

  @IsString()
  label: string;
}

export class ConditionalRuleDto {
  @IsString()
  questionId: string;

  @IsEnum(['equals', 'includes', 'not_equals'])
  operator: 'equals' | 'includes' | 'not_equals';

  value: string | string[];
}

export class QuestionDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsBoolean()
  required: boolean;

  @IsString()
  sectionId: string;

  @IsNumber()
  order: number;

  // Câu hỏi cùng rowGroup render trên 1 hàng (tối đa 3 câu)
  @IsOptional()
  @IsString()
  rowGroup?: string;

  @IsOptional()
  visibleWhen?: ConditionalRuleDto;

  @IsOptional()
  @IsString()
  reportFieldKey?: string;

  @IsOptional()
  @IsBoolean()
  showInChart?: boolean;

  @IsOptional()
  chartType?: 'pie' | 'column';

  @IsOptional()
  reportTemplate?: 'mau01' | 'mau03';

  @IsOptional()
  @IsString()
  excelColumn?: string;
}

export class SectionDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsNumber()
  order: number;
}

export class SurveyHeaderDto {
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() ministry?: string;
  @IsOptional() @IsString() academy?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() fax?: string;
  @IsOptional() @IsBoolean() showDate?: boolean;
}

export class SurveyFooterDto {
  @IsOptional() @IsString() primaryText?: string;
  @IsOptional() @IsString() secondaryText?: string;
}

export class CreateSurveyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections?: SectionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @IsOptional()
  @IsString()
  themeId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SurveyHeaderDto)
  header?: SurveyHeaderDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SurveyFooterDto)
  footer?: SurveyFooterDto;
}
