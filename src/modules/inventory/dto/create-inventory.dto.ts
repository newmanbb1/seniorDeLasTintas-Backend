import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min, Max } from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({ description: 'UUID de la sucursal' })
  @IsUUID()
  branch_id: string;

  @ApiProperty({ description: 'UUID del insumo' })
  @IsUUID()
  supply_id: string;

  @ApiProperty({ example: 100, description: 'Cantidad actual en inventario' })
  @IsInt()
  @Min(0)
  @Max(999999)
  current_quantity: number;

  @ApiProperty({ example: 10, description: 'Stock mínimo para alertas' })
  @IsInt()
  @Min(0)
  @Max(999999)
  minimum_stock: number;
}
