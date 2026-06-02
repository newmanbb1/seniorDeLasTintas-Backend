import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSupplyDto {
  @ApiProperty({ example: '5901234567890', maxLength: 255, required: false })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiProperty({ example: 'Tinta Negra', maxLength: 255 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Tintas', maxLength: 255 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  category: string;

  @ApiProperty({ example: 'litros', maxLength: 64 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  unit_of_measure: string;

  @ApiProperty({
    example: ['/uploads/images/supplies/img1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: ['/uploads/videos/supplies/video1.mp4'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ example: 5, required: false, description: 'Umbral mínimo para alerta de stock crítico' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999)
  umbral_min?: number;
}
