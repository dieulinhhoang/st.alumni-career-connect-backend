import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Payload DN đối tác tự gửi qua API công khai để xin hợp tác.
 * Chỉ nhận các trường do DN tự khai — KHÔNG cho set verified/partnerStatus/status.
 */
export class RegisterEnterpriseDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên doanh nghiệp là bắt buộc' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  size?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Người liên hệ phía DN */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;
}
