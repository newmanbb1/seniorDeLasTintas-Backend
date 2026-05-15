import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class FilterStockTransfer extends PaginationDto {
  @ApiPropertyOptional({ description: "Filter by origin branch ID" })
  @IsOptional()
  @IsUUID()
  origin_branch_id?: string;

  @ApiPropertyOptional({ description: "Filter by destination branch ID" })
  @IsOptional()
  @IsUUID()
  destination_branch_id?: string;

  @ApiPropertyOptional({ description: "Filter by supply ID" })
  @IsOptional()
  @IsUUID()
  supply_id?: string;

  @ApiPropertyOptional({ description: "Filter by status: in_transit, received, rejected" })
  @IsOptional()
  @IsString()
  status?: string;
}