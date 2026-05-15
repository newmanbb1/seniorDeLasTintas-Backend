import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class FilterEmployee extends PaginationDto {
  @ApiPropertyOptional({ description: "Filter by full name (partial match)" })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ description: "Filter by position (partial match)" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: "Filter by branch ID" })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}