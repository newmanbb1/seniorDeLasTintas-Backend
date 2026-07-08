import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderStatus } from '../entities/order.entity';

export class FilterOrder extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Buscar por nombre de cliente (parcial)' })
  @IsOptional()
  @IsString()
  client_name?: string;

  @ApiPropertyOptional({ description: 'Filtrar por sucursal' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;
}
