import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    maximum: 100,
    description: 'Limit of records (max 100)',
  })
  @IsOptional()
  @IsPositive()
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
    description: 'Number of records to skip',
  })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
