import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class FilterBranch extends PaginationDto {
  @ApiPropertyOptional({ description: "Filter by name (partial match)" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Filter by address (partial match)" })
  @IsOptional()
  @IsString()
  address?: string;
}