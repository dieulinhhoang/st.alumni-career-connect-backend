import { IsArray, IsNotEmpty } from "class-validator";
import { IsString } from "class-validator";

export class CreateResourceDto {
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsArray()
    @IsNotEmpty()
    actions?: string[];
}
