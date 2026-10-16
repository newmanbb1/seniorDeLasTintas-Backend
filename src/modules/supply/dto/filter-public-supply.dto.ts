import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterPublicSupply extends PaginationDto {
  @ApiPropertyOptional({
    default: 100,
    minimum: 1,
    maximum: 500,
    description: 'Limit of records for public catalog (max 500)',
  })
  @IsOptional()
  @IsPositive()
  @Max(500)
  @Type(() => Number)
  limit?: number = 100;

  @ApiPropertyOptional({ description: 'Filter by name (partial match)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by category (partial match)' })
  @IsOptional()
  @IsString()
  category?: string;
}
