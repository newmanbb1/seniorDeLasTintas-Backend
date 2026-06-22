import { Module, forwardRef } from '@nestjs/common';
import { ChatbotService } from './services/chatbot.service';
import { EvolutionApiService } from './services/evolution-api.service';
import { WhatsAppSessionService } from './services/whatsapp-session.service';
import { ConversationService } from './services/conversation.service';
import { AiService } from './services/ai.service';
import { ChatbotController } from './controllers/chatbot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';
import { ChatbotLog } from './entities/chatbot-log.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Supply } from '../supply/entities/supply.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsAppSession,
      WhatsAppMessage,
      ChatbotLog,
      Branch,
      Inventory,
      Supply,
      Employee,
      Attendance,
    ]),
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    AiService,
    EvolutionApiService,
    WhatsAppSessionService,
    ConversationService,
  ],
  exports: [ChatbotService, ConversationService],
})
export class ChatbotModule {}
