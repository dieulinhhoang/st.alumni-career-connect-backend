import { IsIn, IsInt, IsOptional, IsString, Length } from "class-validator";

export class CreateUserDto {

    @IsString()
    @Length(1, 255)
    sso_id?: string;

    @IsString()
    @Length(3, 50)
    fullName?: string;

    @IsString()
    @Length(3, 100)
    email?: string;

    @IsString()
    @IsOptional()
    @IsIn(['active', 'inactive'])
    status?: string;

    @IsOptional()
    @IsString()
    @IsIn(['officer', 'admin', 'teacher'])
    type?: string;

    @IsOptional()
    facultyId?: number | null;
}
