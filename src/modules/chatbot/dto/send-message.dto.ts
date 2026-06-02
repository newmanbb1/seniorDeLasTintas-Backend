import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Texto del mensaje a enviar' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
