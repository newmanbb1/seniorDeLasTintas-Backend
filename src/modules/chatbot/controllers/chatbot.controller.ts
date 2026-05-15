import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiErrorResponseDto,
  ApiOkWrapped,
  ok,
} from "src/common/response";
import { ChatbotService } from "../services/chatbot.service";
import { FilterChatbotLog } from "../dto/filter-chatbot-log.dto";

@ApiTags("chatbot")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@Controller("chatbot")
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Webhook para recibir mensajes de Evolution API" })
  async handleWebhook(@Body() payload: any) {
    try {
      if (payload.event === "messages.upsert") {
        const messageData = payload.data?.messages?.[0];
        
        if (messageData && !messageData.key?.fromMe) {
          const remoteJid = messageData.key?.remoteJid;
          const pushName = messageData.pushName;
          
          let messageText = "";
          if (messageData.message?.conversation) {
            messageText = messageData.message.conversation;
          } else if (messageData.message?.extendedTextMessage?.text) {
            messageText = messageData.message.extendedTextMessage.text;
          }

          if (messageText && remoteJid) {
            const phoneNumber = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
            await this.chatbotService.processMessage(phoneNumber, messageText, pushName);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Webhook error:", error);
      return { success: false };
    }
  }

  @Get("logs")
  @ApiOperation({ summary: "Listar logs del chatbot" })
  @ApiOkWrapped()
  async findAllLogs(@Query() filters: FilterChatbotLog) {
    const { limit = 10, offset = 0, phone_number, detected_intention } = filters;
    return ok(
      await this.chatbotService.findAllLogs(limit, offset, phone_number, detected_intention),
    );
  }

  @Post("test")
  @ApiOperation({ summary: "Enviar mensaje de prueba" })
  @ApiOkWrapped()
  async sendTestMessage(@Body() body: { phone: string; message: string }) {
    await this.chatbotService.processMessage(body.phone, body.message, "Test User");
    return ok({ success: true });
  }
}