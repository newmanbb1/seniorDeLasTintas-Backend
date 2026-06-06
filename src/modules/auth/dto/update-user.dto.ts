import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Activar o desactivar usuario' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
