import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Cantidad a ajustar (positiva para entradas, negativa para salidas)', example: -5 })
  @IsInt({ message: 'El ajuste debe ser un número entero' })
  @IsNotEmpty({ message: 'El ajuste es obligatorio' })
  adjustment: number;
}
