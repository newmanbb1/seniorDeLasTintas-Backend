import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApiErrorItemDto {
  @ApiPropertyOptional({ example: "email" })
  field?: string;

  @ApiProperty({ example: "email must be an email" })
  message: string;
}
