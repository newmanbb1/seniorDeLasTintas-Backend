import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateAttendanceDto {
  @ApiProperty({ description: "UUID del empleado" })
  @IsUUID()
  employee_id: string;

  @ApiProperty({ description: "PIN de acceso del empleado", example: "1234" })
  @IsString()
  @IsNotEmpty()
  pin: string;
}