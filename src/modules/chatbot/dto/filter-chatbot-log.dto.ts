import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class FilterChatbotLog extends PaginationDto {
  @ApiPropertyOptional({ description: "Filter by phone number" })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ description: "Filter by detected intention" })
  @IsOptional()
  @IsString()
  detected_intention?: string;

  @ApiPropertyOptional({ description: "Filter by date (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  date?: string;
}