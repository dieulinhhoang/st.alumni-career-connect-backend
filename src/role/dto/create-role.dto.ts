import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-z0-9_]*$/, {
    message: 'code chỉ được chứa chữ thường, số và dấu gạch dưới',
  })
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;
}