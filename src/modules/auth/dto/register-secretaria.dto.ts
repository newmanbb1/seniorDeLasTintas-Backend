import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class RegisterSecretariaDto {
  @ApiProperty({ example: 'secretaria@senordelastintas.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  @ApiProperty({ example: 'Maria Garcia' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  full_name: string;

  @ApiProperty({
    description: 'UUID de la sucursal',
    example: '00000000-0000-4000-8000-000000000002',
  })
  @IsUUID()
  @IsNotEmpty()
  branch_id: string;
}
