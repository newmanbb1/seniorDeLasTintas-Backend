import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterCustomer extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre (parcial)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Buscar por teléfono' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Buscar por NIT' })
  @IsOptional()
  @IsString()
  nit?: string;
}
