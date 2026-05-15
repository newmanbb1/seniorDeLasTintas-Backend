import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ default: 10, minimum: 1, description: "Limit of records" })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: "Number of records to skip" })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}