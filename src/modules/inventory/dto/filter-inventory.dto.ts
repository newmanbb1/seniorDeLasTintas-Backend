import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterInventory extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ description: 'Filter by supply ID' })
  @IsOptional()
  @IsUUID()
  supply_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by current_quantity (exact value)',
  })
  @IsOptional()
  @IsInt()
  current_quantity?: number;

  @ApiPropertyOptional({ description: 'Filter by minimum_stock (exact value)' })
  @IsOptional()
  @IsInt()
  minimum_stock?: number;

  @ApiPropertyOptional({
    description: 'Filter items with low stock (below minimum)',
  })
  @IsOptional()
  low_stock?: boolean;
}
