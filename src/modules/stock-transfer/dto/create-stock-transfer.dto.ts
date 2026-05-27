import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateStockTransferDto {
  @ApiProperty({ description: 'UUID de la sucursal de origen' })
  @IsUUID()
  origin_branch_id: string;

  @ApiProperty({ description: 'UUID de la sucursal de destino' })
  @IsUUID()
  destination_branch_id: string;

  @ApiProperty({ description: 'UUID del insumo a trasladar' })
  @IsUUID()
  supply_id: string;

  @ApiProperty({ example: 50, description: 'Cantidad a trasladar' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Fecha de solicitud del traspaso' })
  @IsNotEmpty()
  request_date: Date;
}
