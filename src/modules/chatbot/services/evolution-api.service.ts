import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EvolutionApiService implements OnModuleInit {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly client: ReturnType<typeof axios.create>;
  private readonly instanceName: string;
  private evolutionAvailable = true;
  private readonly maxRetries = 10;
  private readonly retryDelay = 3000;

  private readonly webhookSecret: string;
  private lastQrCode: string | null = null;
  private lastQrTime: number = 0;
  private readonly qrCooldownMs = 20000;

  constructor(private readonly configService: ConfigService) {
    const evolutionUrl = this.configService.get<string>('EVOLUTION_URL');
    const apiKey = this.configService.get<string>('EVOLUTION_API_KEY');
    const instanceName = this.configService.get<string>('INSTANCE_NAME');
    this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET') || '';

    if (!evolutionUrl) {
      throw new Error('EVOLUTION_URL no configurado en variables de entorno');
    }
    if (!apiKey) {
      throw new Error('EVOLUTION_API_KEY no configurado en variables de entorno');
    }
    if (!instanceName) {
      throw new Error('INSTANCE_NAME no configurado en variables de entorno');
    }
    this.instanceName = instanceName;

    this.client = axios.create({
      baseURL: evolutionUrl,
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      timeout: 300000,
    });
  }

  async onModuleInit() {
    this.logger.log('Iniciando verificación de Evolution API en segundo plano...');
    this.waitForEvolution()
      .then(() => this.initializeInstanceWithRetry())
      .catch((err) =>
        this.logger.error(`Error init Evolution API: ${err.message}`),
      );
  }

  private async waitForEvolution() {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        await this.client.get('/');
        this.logger.log('Evolution API disponible');
        return;
      } catch {
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
          `Instancia ${this.instanceName} existe pero está desconectada. Usa "Reintentar conexión" en el panel`,
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
      this.client.post('/instance/create', {
        instanceName: this.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        clientName: 'senorbot',
      }).catch((err) =>
        this.logger.warn(
          `Create instance response (non-blocking): ${err.message}`,
        ),
      );

      this.evolutionAvailable = true;

      this.logger.log(
        `Instancia ${this.instanceName} solicitada, esperando QR...`,
      );

      await this.delay(5000);
      this.configureWebhook().catch((err) =>
        this.logger.warn(`Webhook config (non-blocking): ${err.message}`),
      );
    } catch (error: any) {
      this.logger.error(
        `Error creando instancia: ${error.response?.data || error.message}`,
      );
    }
  }

  private async configureWebhook() {
    try {
      const webhookUrl = `http://backend:3000/api/chatbot/webhook`;

      const webhookConfig: any = {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CHATS_UPSERT',
          'CHATS_UPDATE',
          'CHATS_SET',
          'CONTACTS_SET',
          'CONTACTS_UPSERT',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
        ],
      };

      if (this.webhookSecret) {
        webhookConfig.headers = { 'x-webhook-secret': this.webhookSecret };
      }

      await this.client.post(`/webhook/set/${this.instanceName}`, {
        webhook: webhookConfig,
      });

      this.logger.log(`Webhook configurado para ${this.instanceName}`);
    } catch (error: any) {
      this.logger.error(
        `Error configurando webhook: ${error.response?.data || error.message}`,
      );
    }
  }

  async sendMessage(to: string, message: string): Promise<string | null> {
    if (!this.evolutionAvailable) {
      this.logger.warn(
        `Evolution API no disponible, mensaje no enviado a ${to}`,
      );
      return null;
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
      return (response.data as any)?.key?.id || null;
    } catch (error: any) {
      if (error.code === 'EAI_AGAIN' || error.response?.status === 404) {
        this.logger.warn(`Evolution API no disponible: ${error.message}`);
        this.evolutionAvailable = false;
        return null;
      }

      this.logger.error(
        `Error sending message to ${to}:`,
        error.response?.data || error.message,
      );
      return null;
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
    const hasNonDigit = /[^\d]/.test(phone);
    // Numbers with non-digit chars (like lids) keep original format
    if (hasNonDigit) {
      return phone;
    }

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

  async sendManualMessage(to: string, text: string): Promise<any> {
    if (!this.evolutionAvailable) {
      this.logger.warn(
        `Evolution API no disponible, mensaje manual no enviado a ${to}`,
      );
      return null;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const response = await this.client.post(
        `/message/sendText/${this.instanceName}`,
        {
          number: formattedNumber,
          text,
        },
      );
      this.logger.log(`Manual message sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'EAI_AGAIN' || error.response?.status === 404) {
        this.evolutionAvailable = false;
        return null;
      }
      this.logger.error(
        `Error sending manual message:`,
        error.response?.data || error.message,
      );
      return null;
    }
  }

  async getQrCode(): Promise<string | null> {
    try {
      const res = await this.client.get(
        `/instance/qrcode/${this.instanceName}`,
      );
      const data = res.data as Record<string, any>;
      const qr = (data?.base64 || data?.qrcode) as string | undefined;
      if (qr) {
        this.logger.log('QR obtenido desde Evolution API');
        return qr;
      }
    } catch (error: any) {
      this.logger.warn(
        `No se pudo obtener QR: ${error.response?.status || error.message}`,
      );
    }
    return null;
  }

  async reconnectInstance(): Promise<{
    success: boolean;
    message: string;
    qrcode?: string;
  }> {
    try {
      // Primero verificar si la instancia ya existe
      try {
        const state = await this.client.get<{ instance: { state: string } }>(
          `/instance/connectionState/${this.instanceName}`,
        );

        const currentState = state.data?.instance?.state;
        this.logger.log(`Instancia ${this.instanceName} existe (estado: ${currentState})`);

        if (currentState === 'open') {
          this.logger.log(`Instancia ${this.instanceName} ya está conectada`);
          await this.configureWebhook();
          return { success: true, message: 'Ya conectado' };
        }

        // Si ya tenemos un QR reciente, devolverlo sin regenerar
        const elapsed = Date.now() - this.lastQrTime;
        if (this.lastQrCode && elapsed < this.qrCooldownMs) {
          this.logger.log(`QR reutilizado (${Math.round(elapsed / 1000)}s)`);
          return { success: true, message: 'Escanea el QR.', qrcode: this.lastQrCode };
        }

        // Intentar obtener QR existente sin regenerar
        try {
          const qrRes = await this.client.get<{ base64?: string; qrcode?: string }>(
            `/instance/qrcode/${this.instanceName}`,
          );
          const existingQr = (qrRes.data?.base64 || qrRes.data?.qrcode) as string | undefined;
          if (existingQr) {
            this.lastQrCode = existingQr;
            this.lastQrTime = Date.now();
            this.logger.log(`QR existente devuelto`);
            this.configureWebhook().catch((err) =>
              this.logger.warn(`Webhook config (non-blocking): ${err.message}`),
            );
            return { success: true, message: 'Escanea el QR.', qrcode: existingQr };
          }
        } catch {
          this.logger.log(`No hay QR existente, generando nuevo...`);
        }

        // Solo regenerar si no hay QR válido
        this.logger.log(`Generando nuevo QR para ${this.instanceName}...`);
        const connectRes = await this.client.get<{ base64?: string; pairingCode?: string; code?: string }>(
          `/instance/connect/${this.instanceName}`,
        );
        const qrcodeBase64 = (connectRes.data?.base64 || connectRes.data?.code) as string | undefined;
        if (qrcodeBase64) {
          this.lastQrCode = qrcodeBase64;
          this.lastQrTime = Date.now();
        }

        this.configureWebhook().catch((err) =>
          this.logger.warn(`Webhook config (non-blocking): ${err.message}`),
        );

        this.evolutionAvailable = true;
        this.logger.log(`QR ${qrcodeBase64 ? 'obtenido' : 'no disponible'} para ${this.instanceName}`);
        return {
          success: true,
          message: qrcodeBase64 ? 'Escanea el QR.' : 'Esperando QR...',
          qrcode: qrcodeBase64,
        };
      } catch (error: any) {
        if (error.response?.status !== 404) throw error;
      }

      // No existe -> crear nueva (non-blocking)
      this.logger.log(`Instancia ${this.instanceName} no existe, creando...`);

      this.client.post('/instance/create', {
        instanceName: this.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }).catch((err) =>
        this.logger.warn(`Create (non-blocking): ${err.message}`),
      );

      this.evolutionAvailable = true;
      await this.delay(5000);

      const connectRes = await this.client.get<{ base64?: string; pairingCode?: string; code?: string }>(
        `/instance/connect/${this.instanceName}`,
      );
      const qrcodeBase64 = (connectRes.data?.base64 || connectRes.data?.code) as string | undefined;
      if (qrcodeBase64) {
        this.lastQrCode = qrcodeBase64;
        this.lastQrTime = Date.now();
      }

      this.configureWebhook().catch((err) =>
        this.logger.warn(`Webhook config (non-blocking): ${err.message}`),
      );

      this.logger.log(`Instancia ${this.instanceName} creada. QR: ${!!qrcodeBase64}`);
      return {
        success: true,
        message: qrcodeBase64 ? 'Escanea el QR.' : 'Esperando QR...',
        qrcode: qrcodeBase64,
      };
    } catch (error: any) {
      this.logger.error(
        'Error reconectando instancia:',
        error.response?.data || error.message,
      );
      return {
        success: false,
        message:
          error.response?.data?.message || 'Error al reconectar instancia',
      };
    }
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
