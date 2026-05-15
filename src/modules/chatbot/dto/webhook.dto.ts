import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class WebhookMessageDto {
  @ApiProperty({ description: "Número de teléfono del remitente" })
  @IsString()
  from: string;

  @ApiProperty({ description: "Nombre del contacto en WhatsApp" })
  @IsOptional()
  @IsString()
  pushName?: string;

  @ApiProperty({ description: "Mensaje recibido" })
  @IsString()
  message: string;

  @ApiProperty({ description: "ID del mensaje" })
  @IsOptional()
  @IsString()
  messageId?: string;
}

export class EvolutionWebhookDto {
  @ApiProperty({ description: "Evento recibido" })
  @IsString()
  event: string;

  @ApiProperty({ description: "Datos del mensaje" })
  @IsOptional()
  data: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
  };
}