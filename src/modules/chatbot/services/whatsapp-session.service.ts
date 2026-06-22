import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WhatsAppSession,
  WhatsAppFlowState,
} from '../entities/whatsapp-session.entity';

@Injectable()
export class WhatsAppSessionService {
  constructor(
    @InjectRepository(WhatsAppSession)
    private readonly sessionRepository: Repository<WhatsAppSession>,
  ) {}

  async getOrCreateSession(
    phoneNumber: string,
    profileName?: string,
  ): Promise<WhatsAppSession> {
    let session = await this.sessionRepository.findOne({
      where: { phone_number: phoneNumber },
    });

    if (!session) {
      session = this.sessionRepository.create({
        phone_number: phoneNumber,
        profile_name: profileName,
        flow_state: WhatsAppFlowState.SeleccionandoCategoria,
        last_interaction: new Date(),
      });
      await this.sessionRepository.save(session);
    } else {
      session.last_interaction = new Date();
      await this.sessionRepository.save(session);
    }

    return session;
  }

  async updateFlowState(
    phoneNumber: string,
    newState: WhatsAppFlowState,
  ): Promise<WhatsAppSession> {
    const session = await this.getOrCreateSession(phoneNumber);
    session.flow_state = newState;
    session.last_interaction = new Date();
    return this.sessionRepository.save(session);
  }

  async resetToMenu(phoneNumber: string): Promise<WhatsAppSession> {
    return this.updateFlowState(phoneNumber, WhatsAppFlowState.SeleccionandoCategoria);
  }

  async getSession(phoneNumber: string): Promise<WhatsAppSession | null> {
    return this.sessionRepository.findOne({
      where: { phone_number: phoneNumber },
    });
  }

  async getActiveSessions(): Promise<WhatsAppSession[]> {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - 30);

    return this.sessionRepository.find({
      where: {
        last_interaction: require('typeorm').MoreThan(cutoff),
      },
    });
  }
}
