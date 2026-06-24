import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ApiErrorResponseDto, ApiOkWrapped, ok } from 'src/common/response';
import { ChatbotService } from '../services/chatbot.service';
import { ConversationService, MessageEvent } from '../services/conversation.service';
import { EvolutionApiService } from '../services/evolution-api.service';
import { FilterChatbotLog } from '../dto/filter-chatbot-log.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { WebhookAuthGuard } from 'src/common/guards/webhook-auth.guard';
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
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Sse('events')
  @ApiOperation({ summary: 'SSE stream de eventos en tiempo real' })
  events(@Req() req: any): Observable<MessageEvent> {
    const authHeader = req.headers?.authorization;
    const queryToken = req.query?.token;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : queryToken;

    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }
    try {
      const payload = this.jwtService.verify(token);
      if (!payload || (payload.role !== 'admin' && payload.type !== 'access')) {
        throw new Error();
      }
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return this.conversationService.subscribe();
  }

  @Post('webhook')
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para recibir mensajes de Evolution API' })
  async handleWebhook(@Body() payload: any) {
    try {
      if (!payload || typeof payload !== 'object') {
        return { success: true };
      }

      const event = payload.event || payload.type || payload.data?.event;

      if (!event) {
        if (payload.messages || payload.message) {
          const messages = payload.messages || [payload];
          for (const messageData of messages) {
            await this.processMessageData(messageData);
          }
        }
        return { success: true };
      }

      if (
        event === 'messages.upsert' ||
        event === 'message' ||
        event === 'messages.update'
      ) {
        let messageData = payload.data;

        if (payload.data?.messages?.[0]) {
          messageData = payload.data.messages[0];
        }

        if (messageData?.message?.conversation) {
          await this.processMessageData(messageData);
        } else if (messageData?.message?.extendedTextMessage?.text) {
          await this.processMessageData(messageData);
        } else if (messageData?.message) {
          await this.processMessageData(messageData);
        }
      } else if (
        event === 'chats.upsert' ||
        event === 'CHATS_UPSERT' ||
        event === 'chats.set' ||
        event === 'CHATS_SET'
      ) {
        const chats = payload.data || [];
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
        await this.conversationService.handleContactUpsert(
          Array.isArray(contacts) ? contacts : [contacts],
        );
        this.conversationService.emit('conversations_updated', {});
      } else if (
        event === 'connection' ||
        event === 'CONNECTION_UPDATE' ||
        event === 'connection.update'
      ) {
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
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de messages upsert' })
  async handleMessagesUpsert(@Body() payload: any) {
    try {
      let messageData = payload.data;

      if (!messageData && payload.data?.messages?.[0]) {
        messageData = payload.data.messages[0];
      }

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
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de messages update' })
  async handleMessagesUpdate(@Body() _payload: any) {
    return { success: true };
  }

  @Post('webhook/chats-upsert')
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de chats upsert' })
  async handleChatsUpsert(@Body() _payload: any) {
    return { success: true };
  }

  @Post('webhook/chats-update')
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de chats update' })
  async handleChatsUpdate() {
    return { success: true };
  }

  @Post('webhook/contacts-update')
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de contacts update' })
  async handleContactsUpdate() {
    return { success: true };
  }

  @Post('webhook/connection-update')
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de connection update' })
  async handleConnectionUpdate(@Body() payload: any) {
    if (payload.data?.instance?.state) {
      this.conversationService.emit(
        'connection_status',
        payload.data.instance.state,
      );
    }
    return { success: true };
  }

  @Post('webhook/qrcode-updated')
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de qrcode updated' })
  async handleQrCodeUpdated(@Body() payload: any) {
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
  @UseGuards(WebhookAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos de presence update' })
  async handlePresenceUpdate() {
    return { success: true };
  }

  private async processMessageData(messageData: any): Promise<void> {
    if (!messageData) {
      console.log('No hay messageData para procesar');
      return;
    }

    const remoteJid =
      messageData.key?.remoteJidAlt ||
      messageData.key?.remoteJid ||
      messageData.remoteJid ||
      '';
    const phone = remoteJid.split('@')[0];

    const whitelistEnv = this.configService.get<string>('WHITELIST_NUMBERS') || '';
    const whitelist = whitelistEnv.split(',').map(n => n.trim().replace(/^591/, '')).filter(Boolean);

    const phoneLocal = phone.replace(/^591/, '');

    if (whitelist.length > 0) {
      if (!whitelist.includes(phoneLocal)) {
        return;
      }
    } else if (messageData.key?.fromMe) {
      return;
    }

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

    const MAX_MSG_LENGTH = 500;
    if (messageText.length > MAX_MSG_LENGTH) {
      return;
    }

    if (remoteJid) {
      if (remoteJid.includes('@g.us')) {
        console.log(`Ignorando mensaje de grupo`);
        return;
      }
      const phoneNumber = remoteJid.split('@')[0];

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar logs del chatbot (solo admin)' })
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

  @SkipThrottle()
  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mensaje de prueba (solo admin)' })
  @ApiBody({ schema: { type: 'object', properties: { phone: { type: 'string', example: '59167645041' }, message: { type: 'string', example: 'Hola' } } } })
  @ApiOkWrapped()
  async sendTestMessage(@Body() body: { phone: string; message: string }) {
    const response = await this.chatbotService.processMessage(
      body.phone,
      body.message,
      'Test User',
    );
    return ok({ response });
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado de conexión de WhatsApp (solo admin)' })
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconectar instancia de WhatsApp (regenera QR, solo admin)' })
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
