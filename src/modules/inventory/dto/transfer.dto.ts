import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min, NotEquals } from 'class-validator';

export class TransferDto {
  @ApiProperty({ description: 'UUID de la sucursal de origen' })
  @IsUUID()
  @IsNotEmpty()
  origin_branch_id: string;

  @ApiProperty({ description: 'UUID de la sucursal de destino' })
  @IsUUID()
  @IsNotEmpty()
  @NotEquals('origin_branch_id', {
    message: 'La sucursal de origen y destino no pueden ser iguales',
  })
  destination_branch_id: string;

  @ApiProperty({ description: 'UUID del insumo a transferir' })
  @IsUUID()
  @IsNotEmpty()
  supply_id: string;

  @ApiProperty({ example: 50, description: 'Cantidad a transferir' })
  @IsInt()
  @Min(1)
  quantity: number;
}
