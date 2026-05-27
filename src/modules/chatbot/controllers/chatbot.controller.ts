import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiErrorResponseDto, ApiOkWrapped, ok } from 'src/common/response';
import { ChatbotService } from '../services/chatbot.service';
import { FilterChatbotLog } from '../dto/filter-chatbot-log.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/modules/auth/entities/user.entity';

@ApiTags('chatbot')
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para recibir mensajes de Evolution API' })
  async handleWebhook(@Body() payload: any) {
    try {
      console.log('Webhook recibido:', JSON.stringify(payload, null, 2));

      // Validar que payload no sea vacío o indefinido
      if (!payload || typeof payload !== 'object') {
        console.log('Payload inválido o vacío');
        return { success: true };
      }

      // Obtener el evento (puede venir como event, type, o en data.event)
      const event = payload.event || payload.type || payload.data?.event;

      if (!event) {
        console.log(
          'Sin evento en payload, intentando procesar como mensaje directo',
        );
        // Intentar procesar directamente como mensaje
        if (payload.messages || payload.message) {
          const messages = payload.messages || [payload];
          for (const messageData of messages) {
            await this.processMessageData(messageData);
          }
        }
        return { success: true };
      }

      console.log('Evento detectado:', event);

      // Manejar diferentes eventos de Evolution API
      if (
        event === 'messages.upsert' ||
        event === 'message' ||
        event === 'messages.update'
      ) {
        console.log('=== Procesando evento de mensaje:', event, '===');
        // La estructura de Evolution API tiene el mensaje en payload.data directamente
        let messageData = payload.data;

        // Para messages.update, puede venir en data.messages[0]
        if (payload.data?.messages?.[0]) {
          messageData = payload.data.messages[0];
        }

        console.log('messageData:', JSON.stringify(messageData, null, 2));

        if (messageData?.message?.conversation) {
          console.log('Mensaje de texto:', messageData.message.conversation);
          await this.processMessageData(messageData);
        } else if (messageData?.message?.extendedTextMessage?.text) {
          console.log(
            'Mensaje extendido:',
            messageData.message.extendedTextMessage.text,
          );
          await this.processMessageData(messageData);
        } else if (messageData?.message) {
          console.log('Otro tipo de mensaje, procesando...');
          await this.processMessageData(messageData);
        }
      } else if (event === 'connection') {
        console.log('Evento de conexión:', payload.data);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false };
    }
  }

  @Post('webhook/messages-upsert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de messages upsert' })
  async handleMessagesUpsert(@Body() payload: any) {
    try {
      console.log('=== Messages upsert FULL payload ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('=== End payload ===');

      // En Evolution API con WEBHOOK_BY_EVENTS, el mensaje viene en payload.data directamente
      // La estructura es: payload.data = { key, message, pushName, ... }
      let messageData = payload.data;

      // Si viene en array messages, usar el primero
      if (!messageData && payload.data?.messages?.[0]) {
        messageData = payload.data.messages[0];
      }

      console.log(
        'Extracted messageData:',
        JSON.stringify(messageData, null, 2),
      );

      if (messageData) {
        await this.processMessageData(messageData);
      }

      return { success: true };
    } catch (error) {
      console.error('Error en messages-upsert:', error);
      return { success: false };
    }
  }

  @Post('webhook/messages-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de messages update' })
  async handleMessagesUpdate(@Body() payload: any) {
    try {
      console.log(
        'Messages update recibido:',
        JSON.stringify(payload, null, 2),
      );
      return { success: true };
    } catch (error) {
      console.error('Error en messages-update:', error);
      return { success: false };
    }
  }

  @Post('webhook/chats-upsert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de chats upsert' })
  async handleChatsUpsert(@Body() payload: any) {
    try {
      console.log('Chats upsert recibido:', JSON.stringify(payload, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error en chats-upsert:', error);
      return { success: false };
    }
  }

  @Post('webhook/chats-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de chats update' })
  async handleChatsUpdate(@Body() payload: any) {
    console.log('Chats update recibido:', JSON.stringify(payload, null, 2));
    return { success: true };
  }

  @Post('webhook/contacts-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de contacts update' })
  async handleContactsUpdate(@Body() payload: any) {
    console.log('Contacts update recibido:', JSON.stringify(payload, null, 2));
    return { success: true };
  }

  @Post('webhook/connection-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de connection update' })
  async handleConnectionUpdate(@Body() payload: any) {
    console.log(
      'Connection update recibido:',
      JSON.stringify(payload, null, 2),
    );
    return { success: true };
  }

  @Post('webhook/qrcode-updated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de qrcode updated' })
  async handleQrCodeUpdated(@Body() payload: any) {
    console.log('QR code updated recibido:', JSON.stringify(payload, null, 2));
    return { success: true };
  }

  @Post('webhook/presence-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de presence update' })
  async handlePresenceUpdate(@Body() payload: any) {
    console.log('Presence update recibido:', JSON.stringify(payload, null, 2));
    return { success: true };
  }

  private async processMessageData(messageData: any): Promise<void> {
    if (!messageData) {
      console.log('No hay messageData para procesar');
      return;
    }

    console.log('=== processMessageData input ===');
    console.log(JSON.stringify(messageData, null, 2));
    console.log('=== end ===');

    // Procesar todos los mensajes que no vengan del webhook global
    // El remoteJidAlt tiene el número real del remitente
    const remoteJid =
      messageData.key?.remoteJidAlt ||
      messageData.key?.remoteJid ||
      messageData.remoteJid;
    const pushName = messageData.pushName || messageData.pushName || 'Usuario';

    let messageText = '';

    // Extraer texto del mensaje (múltiples formatos)
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text;
    } else if (messageData.message?.text?.body) {
      messageText = messageData.message.text.body;
    } else if (messageData.text) {
      messageText = messageData.text;
    } else if (messageData.body) {
      messageText = messageData.body;
    }

    if (!messageText) {
      console.log('No se pudo extraer texto del mensaje');
      return;
    }

    if (remoteJid) {
      if (remoteJid.includes('@g.us')) {
        console.log(`Ignorando mensaje de grupo: ${remoteJid}`);
        return;
      }
      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
      console.log(`Procesando mensaje de ${phoneNumber}: ${messageText}`);
      await this.chatbotService.processMessage(
        phoneNumber,
        messageText,
        pushName,
      );
    }
  }

  @Get('logs')
  @ApiOperation({ summary: 'Listar logs del chatbot' })
  @ApiOkWrapped()
  async findAllLogs(@Query() filters: FilterChatbotLog) {
    const {
      limit = 10,
      offset = 0,
      phone_number,
      detected_intention,
    } = filters;
    return ok(
      await this.chatbotService.findAllLogs(
        limit,
        offset,
        phone_number,
        detected_intention,
      ),
    );
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mensaje de prueba (Admin only)' })
  @ApiOkWrapped()
  async sendTestMessage(@Body() body: { phone: string; message: string }) {
    console.log(
      `Test message - Phone: ${body.phone}, Message: ${body.message}`,
    );
    await this.chatbotService.processMessage(
      body.phone,
      body.message,
      'Test User',
    );
    return ok({ success: true });
  }
}
