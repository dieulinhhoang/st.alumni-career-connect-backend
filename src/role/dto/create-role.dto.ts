import { IsString, Length } from "class-validator";

export class CreateRoleDto {

    @IsString()
    @Length(1, 255)
    name?: string;

    @IsString()
    @Length(1, 255)
    description?: string;

    
 }
