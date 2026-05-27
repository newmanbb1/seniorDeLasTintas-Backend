import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly client: ReturnType<typeof axios.create>;
  private readonly instanceName: string;
  private evolutionAvailable = true;

  constructor(private readonly configService: ConfigService) {
    const evolutionUrl =
      this.configService.get<string>('EVOLUTION_URL') ||
      'http://evolution:8080';
    const apiKey =
      this.configService.get<string>('EVOLUTION_API_KEY') ||
      'fixed-api-key-12345';
    this.instanceName =
      this.configService.get<string>('INSTANCE_NAME') || 'senorbot';

    this.client = axios.create({
      baseURL: evolutionUrl,
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      timeout: 15000,
    });
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.evolutionAvailable) {
      this.logger.warn(
        `Evolution API no disponible, mensaje no enviado a ${to}`,
      );
      return;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);

      const response = await this.client.post(
        `/message/sendText/${this.instanceName}`,
        {
          number: formattedNumber,
          text: message,
        },
      );

      this.logger.log(`Message sent to ${formattedNumber}`);
    } catch (error: any) {
      // Si es error de conexión o 404, marcar como no disponible
      if (error.code === 'EAI_AGAIN' || error.response?.status === 404) {
        this.logger.warn(`Evolution API no disponible: ${error.message}`);
        this.evolutionAvailable = false;
        // No lanzar error, solo registrar y continuar
        return;
      }

      this.logger.error(
        `Error sending message to ${to}:`,
        error.response?.data || error.message,
      );
      // No lanzar error para no romper el flujo del chatbot
    }
  }

  async sendListMessage(
    to: string,
    title: string,
    description: string,
    sections: any[],
  ): Promise<void> {
    if (!this.evolutionAvailable) {
      this.logger.warn(
        `Evolution API no disponible, mensaje de lista no enviado a ${to}`,
      );
      return;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);

      await this.client.post(`/message/sendList/${this.instanceName}`, {
        number: formattedNumber,
        title,
        text: description,
        sections,
      });

      this.logger.log(`List message sent to ${formattedNumber}`);
    } catch (error: any) {
      if (error.code === 'EAI_AGAIN' || error.response?.status === 404) {
        this.evolutionAvailable = false;
        return;
      }
      this.logger.error(
        `Error sending list message to ${to}:`,
        error.response?.data || error.message,
      );
    }
  }

  async sendButtonsMessage(
    to: string,
    title: string,
    buttons: any[],
  ): Promise<void> {
    if (!this.evolutionAvailable) {
      this.logger.warn(
        `Evolution API no disponible, mensaje de botones no enviado a ${to}`,
      );
      return;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);

      await this.client.post(`/message/sendButtons/${this.instanceName}`, {
        number: formattedNumber,
        title,
        message: title,
        buttons,
      });

      this.logger.log(`Buttons message sent to ${formattedNumber}`);
    } catch (error: any) {
      if (error.code === 'EAI_AGAIN' || error.response?.status === 404) {
        this.evolutionAvailable = false;
        return;
      }
      this.logger.error(
        `Error sending buttons message to ${to}:`,
        error.response?.data || error.message,
      );
    }
  }

  private formatPhoneNumber(phone: string): string {
    const cleanNumber = phone.replace(/\D/g, '');

    if (cleanNumber.startsWith('591')) {
      return `${cleanNumber}@s.whatsapp.net`;
    }

    if (cleanNumber.startsWith('0')) {
      return `591${cleanNumber.substring(1)}@s.whatsapp.net`;
    }

    if (cleanNumber.length === 9) {
      return `591${cleanNumber}@s.whatsapp.net`;
    }

    return `${cleanNumber}@s.whatsapp.net`;
  }

  async getInstanceStatus(): Promise<any> {
    try {
      const response = await this.client.get(
        `/instance/connectionState/${this.instanceName}`,
      );
      this.evolutionAvailable = true;
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error getting instance status:',
        error.response?.data || error.message,
      );

      if (error.code === 'EAI_AGAIN' || error.response?.status === 404) {
        this.evolutionAvailable = false;
      }

      return null;
    }
  }
}
