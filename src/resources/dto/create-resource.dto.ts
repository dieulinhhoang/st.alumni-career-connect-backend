import { IsArray, IsNotEmpty } from "class-validator";
import { IsString } from "class-validator";

export class CreateResourceDto {
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsNotEmpty()
    code?: string;
    
    @IsString()
    @IsArray()
    @IsNotEmpty()
    actions?: string[];
}
