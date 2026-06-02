import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ApiErrorResponseDto, ApiOkWrapped, ok } from 'src/common/response';
import { ChatbotService } from '../services/chatbot.service';
import { ConversationService, MessageEvent } from '../services/conversation.service';
import { EvolutionApiService } from '../services/evolution-api.service';
import { FilterChatbotLog } from '../dto/filter-chatbot-log.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/modules/auth/entities/user.entity';

@ApiTags('chatbot')
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly conversationService: ConversationService,
    private readonly evolutionApiService: EvolutionApiService,
  ) {}

  @Sse('events')
  @ApiOperation({ summary: 'SSE stream de eventos en tiempo real' })
  events(): Observable<MessageEvent> {
    return this.conversationService.subscribe();
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para recibir mensajes de Evolution API' })
  async handleWebhook(@Body() payload: any) {
    try {
      console.log('Webhook recibido:', JSON.stringify(payload, null, 2));

      if (!payload || typeof payload !== 'object') {
        console.log('Payload inválido o vacío');
        return { success: true };
      }

      const event = payload.event || payload.type || payload.data?.event;

      if (!event) {
        console.log(
          'Sin evento en payload, intentando procesar como mensaje directo',
        );
        if (payload.messages || payload.message) {
          const messages = payload.messages || [payload];
          for (const messageData of messages) {
            await this.processMessageData(messageData);
          }
        }
        return { success: true };
      }

      console.log('Evento detectado:', event);

      if (
        event === 'messages.upsert' ||
        event === 'message' ||
        event === 'messages.update'
      ) {
        console.log('=== Procesando evento de mensaje:', event, '===');
        let messageData = payload.data;

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
      } else if (
        event === 'chats.upsert' ||
        event === 'CHATS_UPSERT' ||
        event === 'chats.set' ||
        event === 'CHATS_SET'
      ) {
        const chats = payload.data || [];
        console.log(`Evento de chats: ${event}, ${chats.length} chats`);
        await this.conversationService.handleChatUpsert(
          Array.isArray(chats) ? chats : [chats],
        );
        this.conversationService.emit('conversations_updated', {});
      } else if (
        event === 'contacts.set' ||
        event === 'CONTACTS_SET' ||
        event === 'contacts.upsert' ||
        event === 'CONTACTS_UPSERT'
      ) {
        const contacts = payload.data || [];
        console.log(`Evento de contactos: ${event}, ${contacts.length} contactos`);
        await this.conversationService.handleContactUpsert(
          Array.isArray(contacts) ? contacts : [contacts],
        );
        this.conversationService.emit('conversations_updated', {});
      } else if (
        event === 'connection' ||
        event === 'CONNECTION_UPDATE' ||
        event === 'connection.update'
      ) {
        console.log('Evento de conexión:', payload.data);
        const state =
          payload.data?.instance?.state ||
          payload.data?.state;
        if (state) {
          this.conversationService.emit('connection_status', state);
        }
      } else if (
        event === 'qrcode.updated' ||
        event === 'QRCODE_UPDATED' ||
        event === 'qrcode_updated'
      ) {
        console.log('QR actualizado vía webhook general');
        const qrPayload = payload.data || payload;
        const qrObj = qrPayload?.qrcode;
        if (qrObj) {
          const qrBase64 = typeof qrObj === 'string' ? qrObj : qrObj.base64;
          if (qrBase64) {
            this.conversationService.emit('qrcode_updated', {
              qrcode: qrBase64,
            });
          }
        }
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

      let messageData = payload.data;

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
    if (payload.data?.instance?.state) {
      this.conversationService.emit(
        'connection_status',
        payload.data.instance.state,
      );
    }
    return { success: true };
  }

  @Post('webhook/qrcode-updated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de qrcode updated' })
  async handleQrCodeUpdated(@Body() payload: any) {
    console.log('QR code updated recibido:', JSON.stringify(payload, null, 2));
    const qrObj = payload.data?.qrcode;
    if (qrObj) {
      const qrBase64 = typeof qrObj === 'string' ? qrObj : qrObj.base64;
      if (qrBase64) {
        this.conversationService.emit('qrcode_updated', { qrcode: qrBase64 });
      }
    }
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

    if (messageData.key?.fromMe) {
      console.log('Ignorando mensaje propio (fromMe = true)');
      return;
    }

    console.log('=== processMessageData input ===');
    console.log(JSON.stringify(messageData, null, 2));
    console.log('=== end ===');

    const remoteJid =
      messageData.key?.remoteJidAlt ||
      messageData.key?.remoteJid ||
      messageData.remoteJid;
    const pushName = messageData.pushName || messageData.pushName || '';
    const waMessageId = messageData.key?.id;

    let messageText = '';

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
      const phoneNumber = remoteJid.split('@')[0];
      console.log(`Procesando mensaje de ${phoneNumber}: ${messageText}`);

      await this.conversationService.saveIncomingMessage({
        phoneNumber,
        profileName: pushName,
        messageText,
        waMessageId,
        timestamp: new Date(),
      });

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
  @ApiBody({ schema: { type: 'object', properties: { phone: { type: 'string', example: '59167645041' }, message: { type: 'string', example: 'Hola' } } } })
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

  @Get('status')
  @ApiOperation({ summary: 'Estado de conexión de WhatsApp' })
  async getStatus() {
    const status = await this.evolutionApiService.getInstanceStatus();
    return { state: status?.instance?.state || 'close' };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar conversaciones de WhatsApp' })
  @ApiOkWrapped()
  async getConversations() {
    return ok(await this.conversationService.getConversations());
  }

  @Get('conversations/:phone/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  @ApiOkWrapped()
  async getMessages(@Param('phone') phone: string) {
    return ok(await this.conversationService.getMessages(phone));
  }

  @Post('conversations/:phone/read')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar conversación como leída' })
  @ApiOkWrapped()
  async markAsRead(@Param('phone') phone: string) {
    await this.conversationService.markAsRead(phone);
    return ok({ success: true });
  }

  @Post('conversations/:phone/messages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mensaje manual a una conversación' })
  @ApiOkWrapped()
  async sendMessage(
    @Param('phone') phone: string,
    @Body() body: SendMessageDto,
  ) {
    const message = await this.conversationService.sendManualMessage(
      phone,
      body.message,
    );
    return ok(message);
  }

  @Post('conversations/:phone/archive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archivar/desarchivar conversación' })
  @ApiOkWrapped()
  async toggleArchive(@Param('phone') phone: string) {
    const session = await this.conversationService.toggleArchive(phone);
    return ok(session);
  }

  @Post('reconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconectar instancia de WhatsApp (regenera QR)' })
  @ApiOkWrapped()
  async reconnect() {
    const result = await this.evolutionApiService.reconnectInstance();
    if (result.success && result.qrcode) {
      this.conversationService.emit('qrcode_updated', {
        qrcode: result.qrcode,
      });
    }
    return ok(result);
  }
}
