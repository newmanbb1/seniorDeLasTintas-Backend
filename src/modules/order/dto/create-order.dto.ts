import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

class OrderItemDto {
  @ApiProperty({ description: 'UUID del insumo' })
  @IsUUID()
  supply_id: string;

  @ApiProperty({ example: 2, description: 'Cantidad' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Juan Pérez', maxLength: 255 })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  client_name: string;

  @ApiProperty({ example: '59162454434', maxLength: 20 })
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  client_phone: string;

  @ApiProperty({ type: [OrderItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
