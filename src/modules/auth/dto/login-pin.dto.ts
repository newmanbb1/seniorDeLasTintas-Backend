import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginPinDto {
  @ApiProperty({
    example: '1234',
    description: 'PIN de acceso del empleado (4-6 dígitos)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(6)
  pin: string;
}
