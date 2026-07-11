import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { WhatsAppSession } from '../entities/whatsapp-session.entity';
import {
  WhatsAppMessage,
  WhatsAppMessageType,
} from '../entities/whatsapp-message.entity';
import { EvolutionApiService } from './evolution-api.service';

export interface MessageEvent {
  data: string;
  id?: string;
  type?: string;
  retry?: number;
}

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private eventSubject = new Subject<MessageEvent>();

  constructor(
    @InjectRepository(WhatsAppSession)
    private readonly sessionRepo: Repository<WhatsAppSession>,
    @InjectRepository(WhatsAppMessage)
    private readonly messageRepo: Repository<WhatsAppMessage>,
    private readonly evolutionApiService: EvolutionApiService,
  ) {}

  subscribe(): Observable<MessageEvent> {
    return this.eventSubject.asObservable();
  }

  emit(event: string, data: any) {
    this.eventSubject.next({ type: event, data: JSON.stringify(data) });
  }

  async getConversations(): Promise<WhatsAppSession[]> {
    return this.sessionRepo.find({
      order: { last_message_at: 'DESC' },
    });
  }

  async getMessages(phone: string): Promise<WhatsAppMessage[]> {
    return this.messageRepo.find({
      where: { phone_number: phone },
      order: { timestamp: 'ASC' },
      take: 100,
    });
  }

  async markAsRead(phone: string): Promise<void> {
    await this.sessionRepo.update(
      { phone_number: phone },
      { unread_count: 0 },
    );
  }

  async saveIncomingMessage(data: {
    phoneNumber: string;
    profileName?: string;
    messageText: string;
    waMessageId?: string;
    messageType?: string;
    timestamp: Date;
  }): Promise<WhatsAppMessage> {
    let session = await this.sessionRepo.findOne({
      where: { phone_number: data.phoneNumber },
    });

    if (!session) {
      session = this.sessionRepo.create({
        phone_number: data.phoneNumber,
        profile_name: data.profileName || data.phoneNumber,
        last_message: data.messageText,
        last_message_at: data.timestamp,
        unread_count: 1,
        last_interaction: data.timestamp,
      });
    } else {
      session.last_message = data.messageText;
      session.last_message_at = data.timestamp;
      session.unread_count = (session.unread_count || 0) + 1;
      session.last_interaction = data.timestamp;
      if (data.profileName) {
        session.profile_name = data.profileName;
      }
    }
    await this.sessionRepo.save(session);

    const msgType = Object.values(WhatsAppMessageType).includes(
      data.messageType as WhatsAppMessageType,
    )
      ? (data.messageType as WhatsAppMessageType)
      : WhatsAppMessageType.Text;

    const message = this.messageRepo.create({
      phone_number: data.phoneNumber,
      from_me: false,
      message_type: msgType,
      content: data.messageText,
      wa_message_id: data.waMessageId,
      timestamp: data.timestamp,
      created_by: '00000000-0000-4000-8000-000000000001',
    });
    await this.messageRepo.save(message);

    this.emit('new_message', message);
    return message;
  }

  async saveOutgoingMessage(data: {
    phoneNumber: string;
    messageText: string;
    waMessageId?: string;
    timestamp: Date;
  }): Promise<WhatsAppMessage> {
    const message = this.messageRepo.create({
      phone_number: data.phoneNumber,
      from_me: true,
      message_type: WhatsAppMessageType.Text,
      content: data.messageText,
      wa_message_id: data.waMessageId,
      timestamp: data.timestamp,
      created_by: '00000000-0000-4000-8000-000000000001',
    });
    await this.messageRepo.save(message);

    await this.sessionRepo.update(
      { phone_number: data.phoneNumber },
      { last_message: data.messageText, last_message_at: data.timestamp },
    );

    this.emit('new_message', message);
    return message;
  }

  async sendManualMessage(
    phone: string,
    text: string,
  ): Promise<WhatsAppMessage> {
    const message = this.messageRepo.create({
      phone_number: phone,
      from_me: true,
      message_type: WhatsAppMessageType.Text,
      content: text,
      timestamp: new Date(),
      created_by: '00000000-0000-4000-8000-000000000001',
    });
    await this.messageRepo.save(message);

    await this.sessionRepo.update(
      { phone_number: phone },
      { last_message: text, last_message_at: new Date() },
    );

    const result = await this.evolutionApiService.sendManualMessage(
      phone,
      text,
    );
    if (result?.key?.id) {
      message.wa_message_id = result.key.id;
      await this.messageRepo.save(message);
    }

    this.emit('new_message', message);
    return message;
  }

  async handleChatUpsert(chatDataArray: any[]): Promise<void> {
    if (!Array.isArray(chatDataArray)) {
      return;
    }
    for (const chat of chatDataArray) {
      const rawJid = chat.remoteJid || chat.id || chat.jid;
      if (
        !rawJid ||
        rawJid.includes('@g.us') ||
        rawJid.includes('@broadcast') ||
        rawJid.includes('@bot') ||
        rawJid.includes('@newsletter')
      )
        continue;

      const phoneNumber = rawJid.split('@')[0];
      if (!phoneNumber || phoneNumber.length < 4) continue;

      const profileName =
        chat.name || chat.pushName || chat.notify || phoneNumber;
      const conversationTimestamp = chat.conversationTimestamp || chat.t;
      const timestamp = conversationTimestamp
        ? new Date(conversationTimestamp * 1000)
        : new Date();
      const lastMessage =
        chat.lastMessage?.conversation ||
        chat.lastMessage?.body ||
        '';

      let session = await this.sessionRepo.findOne({
        where: { phone_number: phoneNumber },
      });

      if (!session) {
        session = this.sessionRepo.create({
          phone_number: phoneNumber,
          profile_name: profileName,
          last_message: lastMessage,
          last_message_at: timestamp,
          unread_count: chat.unreadCount || 0,
          last_interaction: timestamp,
        });
        await this.sessionRepo.save(session);
        this.logger.log(
          `Sesión creada para ${phoneNumber} (${profileName}) desde sync de chats`,
        );
      }
    }
  }

  async handleContactUpsert(contactDataArray: any[]): Promise<void> {
    if (!Array.isArray(contactDataArray)) {
      return;
    }
    for (const contact of contactDataArray) {
      const rawJid = contact.remoteJid || contact.id || contact.jid;
      if (!rawJid) continue;

      const phoneNumber = rawJid.split('@')[0];
      if (!phoneNumber || phoneNumber.length < 4) continue;

      const contactName =
        contact.name || contact.pushName || contact.notify || contact.verifiedName;

      if (!contactName) continue;

      const session = await this.sessionRepo.findOne({
        where: { phone_number: phoneNumber },
      });

      if (session && session.profile_name === phoneNumber) {
        session.profile_name = contactName;
        await this.sessionRepo.save(session);
        this.logger.log(
          `Nombre actualizado para ${phoneNumber}: ${contactName}`,
        );
      } else if (!session) {
        await this.sessionRepo.save(
          this.sessionRepo.create({
            phone_number: phoneNumber,
            profile_name: contactName,
            last_interaction: new Date(),
          }),
        );
        this.logger.log(
          `Sesión creada desde contacto para ${phoneNumber}: ${contactName}`,
        );
      }
    }
  }

  async toggleArchive(
    phone: string,
  ): Promise<WhatsAppSession | null> {
    const session = await this.sessionRepo.findOne({
      where: { phone_number: phone },
    });
    if (session) {
      session.is_archived = !session.is_archived;
      await this.sessionRepo.save(session);
    }
    return session;
  }
}
