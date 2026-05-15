import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly client: ReturnType<typeof axios.create>;
  private readonly instanceName: string;

  constructor(private readonly configService: ConfigService) {
    const evolutionUrl = this.configService.get<string>("EVOLUTION_URL") || "http://evolution:8080";
    const apiKey = this.configService.get<string>("EVOLUTION_API_KEY") || "";
    this.instanceName = this.configService.get<string>("INSTANCE_NAME") || "default";

    this.client = axios.create({
      baseURL: evolutionUrl,
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      timeout: 10000,
    });
  }

  async sendMessage(to: string, message: string): Promise<void> {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      await this.client.post(`/message/sendText/${this.instanceName}`, {
        number: formattedNumber,
        text: message,
      });
      
      this.logger.log(`Message sent to ${formattedNumber}`);
    } catch (error) {
      this.logger.error(`Error sending message to ${to}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async sendListMessage(to: string, title: string, description: string, sections: any[]): Promise<void> {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      await this.client.post(`/message/sendList/${this.instanceName}`, {
        number: formattedNumber,
        title,
        text: description,
        sections,
      });
      
      this.logger.log(`List message sent to ${formattedNumber}`);
    } catch (error) {
      this.logger.error(`Error sending list message to ${to}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async sendButtonsMessage(to: string, title: string, buttons: any[]): Promise<void> {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      await this.client.post(`/message/sendButtons/${this.instanceName}`, {
        number: formattedNumber,
        title,
        message: title,
        buttons,
      });
      
      this.logger.log(`Buttons message sent to ${formattedNumber}`);
    } catch (error) {
      this.logger.error(`Error sending buttons message to ${to}:`, error.response?.data || error.message);
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    const cleanNumber = phone.replace(/\D/g, "");
    
    if (cleanNumber.startsWith("591")) {
      return `${cleanNumber}@s.whatsapp.net`;
    }
    
    if (cleanNumber.startsWith("0")) {
      return `591${cleanNumber.substring(1)}@s.whatsapp.net`;
    }
    
    if (cleanNumber.length === 9) {
      return `591${cleanNumber}@s.whatsapp.net`;
    }
    
    return `${cleanNumber}@s.whatsapp.net`;
  }

  async getInstanceStatus(): Promise<any> {
    try {
      const response = await this.client.get(`/instance/connectionState/${this.instanceName}`);
      return response.data;
    } catch (error) {
      this.logger.error("Error getting instance status:", error.response?.data || error.message);
      return null;
    }
  }
}