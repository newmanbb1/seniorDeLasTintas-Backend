import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EvolutionInitService implements OnModuleInit {
  private readonly logger = new Logger(EvolutionInitService.name);
  private readonly client: ReturnType<typeof axios.create>;
  private readonly instanceName: string;
  private readonly maxRetries = 10;
  private readonly retryDelay = 3000;

  constructor(private readonly configService: ConfigService) {
    const evolutionUrl =
      this.configService.get<string>('EVOLUTION_URL') ||
      'http://evolution:8080';
    const apiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
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

  async onModuleInit() {
    this.logger.log('Iniciando verificación de Evolution API...');
    await this.waitForEvolution();
    await this.initializeInstanceWithRetry();
  }

  private async waitForEvolution() {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        await this.client.get('/');
        this.logger.log('Evolution API disponible');
        return;
      } catch (error) {
        this.logger.log(
          `Esperando Evolution API... (intento ${i + 1}/${this.maxRetries})`,
        );
        await this.delay(this.retryDelay);
      }
    }
    this.logger.warn('Evolution API no disponible, se intentará anyway');
  }

  private async initializeInstanceWithRetry() {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.initializeInstance();
        return;
      } catch (error: any) {
        this.logger.warn(`Intento ${attempt} fallido: ${error.message}`);
        await this.delay(2000);
      }
    }
  }

  private async initializeInstance() {
    try {
      this.logger.log(`Verificando instancia: ${this.instanceName}`);

      const state = await this.client.get<{ instance: { state: string } }>(
        `/instance/connectionState/${this.instanceName}`,
      );

      if (state.data.instance?.state === 'open') {
        this.logger.log(`Instancia ${this.instanceName} ya está conectada`);
        await this.configureWebhook();
        return;
      }

      if (state.data.instance?.state === 'close') {
        this.logger.warn(
          `Instancia ${this.instanceName} existe pero está desconectada. Escanea el QR en el panel de Evolution API`,
        );
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.log(`Instancia ${this.instanceName} no existe, creando...`);
        await this.createInstance();
        return;
      }

      this.logger.error(`Error verificando instancia: ${error.message}`);
      throw error;
    }
  }

  private async createInstance() {
    try {
      await this.client.post('/instance/create', {
        instanceName: this.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrCode: true,
      });

      this.logger.log(
        `Instancia ${this.instanceName} creada. Escanea el QR en el panel de Evolution API`,
      );

      await this.delay(2000);
      await this.configureWebhook();
    } catch (error: any) {
      this.logger.error(
        `Error creando instancia: ${error.response?.data || error.message}`,
      );
    }
  }

  private async configureWebhook() {
    try {
      const webhookUrl = `http://backend:3000/api/chatbot/webhook`;

      await this.client.post(`/webhook/set/${this.instanceName}`, {
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CHATS_UPDATE',
            'CONNECTION_UPDATE',
          ],
        },
      });

      this.logger.log(`Webhook configurado para ${this.instanceName}`);
    } catch (error: any) {
      this.logger.error(
        `Error configurando webhook: ${error.response?.data || error.message}`,
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
