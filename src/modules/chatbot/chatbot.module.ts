import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
import { Employee } from '../employee/entities/employee.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { SupplyModule } from '../supply/supply.module';

@Module({
  imports: [
    SupplyModule,
    TypeOrmModule.forFeature([
      WhatsAppSession,
      WhatsAppMessage,
      ChatbotLog,
      Branch,
      Inventory,
      Employee,
      Attendance,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
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
