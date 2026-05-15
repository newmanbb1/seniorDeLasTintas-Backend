import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateEmployeeDto {
  @ApiProperty({ example: "Juan Pérez", maxLength: 255 })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  full_name: string;

  @ApiProperty({ example: "1234", description: "PIN de acceso (4-6 dígitos)" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(6)
  access_pin: string;

  @ApiProperty({ example: "Vendedor", maxLength: 255 })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  position: string;

  @ApiProperty({ description: "UUID de la sucursal" })
  @IsUUID()
  branch_id: string;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  active: boolean = true;
}