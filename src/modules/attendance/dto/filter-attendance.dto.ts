import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class FilterAttendance extends PaginationDto {
  @ApiPropertyOptional({ description: "Filter by employee ID" })
  @IsOptional()
  @IsUUID()
  employee_id?: string;

  @ApiPropertyOptional({ description: "Filter by register date (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  register_date?: string;

  @ApiPropertyOptional({ description: "Filter by check-in status: punctual, late, absence" })
  @IsOptional()
  @IsString()
  check_in_status?: string;

  @ApiPropertyOptional({ description: "Filter by branch ID" })
  @IsOptional()
  @IsUUID()
  branch_id?: string;
}