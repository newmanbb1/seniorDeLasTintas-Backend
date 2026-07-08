import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  WhatsAppSession,
  WhatsAppFlowState,
} from '../entities/whatsapp-session.entity';
import { ChatbotLog, ChatbotIntention } from '../entities/chatbot-log.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { Supply } from '../../supply/entities/supply.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { EvolutionApiService } from './evolution-api.service';
import { WhatsAppSessionService } from './whatsapp-session.service';
import { ConversationService } from './conversation.service';
import { AiService, AiIntentResult } from './ai.service';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(WhatsAppSession)
    private readonly sessionRepository: Repository<WhatsAppSession>,
    @InjectRepository(ChatbotLog)
    private readonly logRepository: Repository<ChatbotLog>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => EvolutionApiService))
    private readonly evolutionApiService: EvolutionApiService,
    private readonly sessionService: WhatsAppSessionService,
    private readonly conversationService: ConversationService,
    private readonly aiService: AiService,
  ) {}

  async processMessage(
    phoneNumber: string,
    message: string,
    pushName?: string,
  ): Promise<string> {
    const testMode = this.configService.get<string>('TEST_MODE') === 'true';
    const testPhone = this.configService.get<string>('TEST_PHONE') || '';
    const testPhones = testPhone.split(',').map(p => p.trim());
    if (testMode && !testPhones.includes(phoneNumber)) {
      console.log(`[TEST MODE] Ignorando mensaje de ${phoneNumber} (solo ${testPhone} permitido)`);
      return '';
    }

    const session = await this.sessionService.getOrCreateSession(
      phoneNumber,
      pushName,
    );
    const normalizedMessage = message.trim().toLowerCase();
    const aiResult = await this.aiService.classifyIntent(message);
    const detectedIntention = this.mapAiIntentToLogIntention(aiResult);

    let response = '';
    let newState = session.flow_state;

    if (normalizedMessage === '0') {
      response = this.getCategoryMenu();
      newState = WhatsAppFlowState.SeleccionandoCategoria;
    } else if (['1', '2', '3', '4'].includes(normalizedMessage)) {
      response = this.getCategoryResponse(normalizedMessage);
      newState = WhatsAppFlowState.SeleccionandoCategoria;
    } else {
      switch (aiResult.intencion) {
        case 'SALUDO':
          response = this.getCategoryMenu();
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'CATEGORIA_TINTAS':
        case 'CATEGORIA_TONER':
        case 'CATEGORIA_REPUESTO':
          const categorySearchMap: Record<string, string> = {
            CATEGORIA_TINTAS: 'tintas',
            CATEGORIA_TONER: 'toner',
            CATEGORIA_REPUESTO: 'repuestos',
          };
          response = await this.handleCategoryQuery(categorySearchMap[aiResult.intencion], aiResult);
          if (!response) {
            response = aiResult.respuesta || this.getCategoryResponse(
              { CATEGORIA_TINTAS: '1', CATEGORIA_TONER: '2', CATEGORIA_REPUESTO: '4' }[aiResult.intencion]
            );
          }
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'CATEGORIA_SERVICIO_TECNICO':
          response = aiResult.respuesta || this.getCategoryResponse('3');
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'CONSULTAR_STOCK':
          response = await this.handleStockWithAI(aiResult);
          if (!response) {
            const brandResponse = aiResult.respuesta ||
              `Claro, trabajamos con ${aiResult.parametros?.marca || 'esa marca'} 😊\n\n` +
              'Tenemos tintas y tóner originales y compatibles. ¿Buscas algún producto en específico?\n' +
              'Escribe 0 para volver al menú';
            response = brandResponse;
          }
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'CONSULTAR_HORARIO':
          response = await this.getHorariosMessage();
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'MENU':
          response = this.getCategoryMenu();
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        default:
          response = aiResult.respuesta || this.getCategoryMenu();
          newState = WhatsAppFlowState.SeleccionandoCategoria;
      }
    }

    if (!response) {
      response = this.getCategoryMenu();
      newState = WhatsAppFlowState.SeleccionandoCategoria;
    }

    await this.logInteraction(phoneNumber, message, response, detectedIntention);
    if (testMode && !testPhones.includes(phoneNumber)) {
      console.log(`[TEST MODE] Respuesta para ${phoneNumber}:\n${response}`);
    } else {
      await this.sendResponse(phoneNumber, response);
    }
    await this.sessionService.updateFlowState(phoneNumber, newState);

    return response;
  }

  private getGreeting(name?: string): string {
    const greetings = [
      `¡Hola${name ? ' ' + name : ''}! 😊 Bienvenido a *Señor de las Tintas*. ¿En qué puedo ayudarte hoy?`,
      `¡Qué tal${name ? ' ' + name : ''}! 👋 Me alegra verte por aquí. ¿Necesitas algo de la tienda?`,
      `¡Buenas${name ? ' ' + name : ''}! 🎨 Gracias por escribirnos. ¿Qué buscas el día de hoy?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)] + '\n\n' + this.getCategoryMenu();
  }

  private mapAiIntentToLogIntention(aiResult: AiIntentResult): ChatbotIntention {
    const map: Record<string, ChatbotIntention> = {
      SALUDO: ChatbotIntention.Saludo,
      CATEGORIA_TINTAS: ChatbotIntention.CategoriaTintas,
      CATEGORIA_TONER: ChatbotIntention.CategoriaToner,
      CATEGORIA_SERVICIO_TECNICO: ChatbotIntention.CategoriaServicioTecnico,
      CATEGORIA_REPUESTO: ChatbotIntention.CategoriaRepuesto,
      CONSULTAR_STOCK: ChatbotIntention.ConsultarStock,
      CONSULTAR_HORARIO: ChatbotIntention.ConsultarHorario,
      MENU: ChatbotIntention.MenuPrincipal,
    };
    return map[aiResult.intencion] || ChatbotIntention.Unknown;
  }

  private getCategoryMenu(): string {
    return (
      '*Señor de las Tintas* 🎨\n\n' +
      '¿Qué está buscando el día de hoy?\n\n' +
      '✨ *Tintas*\n' +
      '✨ *Tóner*\n' +
      '✨ *Servicio Técnico*\n' +
      '✨ *Repuestos*\n\n' +
      'Solo escríbenos el servicio que necesitas'
    );
  }

  private getCategoryResponse(option: string): string {
    switch (option) {
      case '1':
        return (
          '*TINTAS*\n\n' +
          'Tenemos tintas originales y compatibles para todas las marcas:\n' +
          '• Canon\n' +
          '• Epson\n' +
          '• HP\n' +
          '• Brother\n\n' +
          '✅ Alta calidad\n' +
          '✅ Precios competitivos\n' +
          '✅ Entregas inmediatas\n\n' +
          '🔗 *Ver catálogo completo:*\n' +
          'https://tintas.com/consulta/stock\n\n' +
          'Escribe 0 para volver al menú'
        );
      case '2':
        return (
          '*TÓNER*\n\n' +
          'Disponemos de tóner original y compatible para:\n' +
          '• Canon\n' +
          '• HP\n' +
          '• Samsung\n' +
          '• Brother\n\n' +
          '✅ Entregas inmediatas\n' +
          '✅ Precios especiales por mayoreo\n\n' +
          '🔗 *Ver catálogo de tóner:*\n' +
          'https://tintas.com/consulta/stock?categoria=toner\n\n' +
          'Escribe 0 para volver al menú'
        );
      case '3':
        return (
          '*SERVICIO TÉCNICO*\n\n' +
          'Ofrecemos:\n' +
          '• Mantenimiento preventivo y correctivo\n' +
          '• Reparación de impresoras\n' +
          '• Instalación y configuración\n' +
          '• Diagnóstico sin costo\n\n' +
          '📍 Visítanos o contáctanos para agendar una cita\n\n' +
          '🔗 *Más información:*\n' +
          'https://tintas.com/consulta/servicio-tecnico\n\n' +
          'Escribe 0 para volver al menú'
        );
      case '4':
        return (
          '*REPUESTOS*\n\n' +
          'Contamos con repuestos originales y genéricos:\n' +
          '• Cabezales\n' +
          '• Bandejas de papel\n' +
          '• Rodillos\n' +
          '• Fusores\n' +
          '• Y más...\n\n' +
          '🔗 *Ver catálogo de repuestos:*\n' +
          'https://tintas.com/consulta/repuestos\n\n' +
          'Escribe 0 para volver al menú'
        );
      default:
        return this.getCategoryMenu();
    }
  }

  private async handleStockWithAI(aiResult: AiIntentResult): Promise<string> {
    const marca = aiResult.parametros?.marca?.toLowerCase() || '';
    const producto = aiResult.parametros?.producto?.toLowerCase() || '';

    const supplies = await this.supplyRepository.find({
      where: { deleted_at: IsNull() },
      relations: ['inventories', 'inventories.branch'],
    });

    let matchedSupplies = supplies;

    if (marca) {
      matchedSupplies = matchedSupplies.filter(
        (s) =>
          s.name.toLowerCase().includes(marca) ||
          s.category.toLowerCase().includes(marca),
      );
    }
    if (producto) {
      matchedSupplies = matchedSupplies.filter(
        (s) =>
          s.name.toLowerCase().includes(producto) ||
          s.category.toLowerCase().includes(producto),
      );
    }

    if (matchedSupplies.length === 0) {
      return '';
    }

    const lines: string[] = [];
    for (const supply of matchedSupplies.slice(0, 5)) {
      const inventories =
        supply.inventories?.filter((inv) => !inv.deleted_at) || [];
      lines.push(`*${supply.name}* (${supply.category})`);
      if (inventories.length === 0) {
        lines.push('  😕 Sin stock por el momento');
      } else {
        for (const inv of inventories) {
          lines.push(
            `  📍 ${inv.branch?.name || 'Sucursal'}: ${inv.current_quantity} ${supply.unit_of_measure}`,
          );
        }
      }
      lines.push('');
    }

    const intro = marca || producto
      ? `Aquí tienes lo que encontré sobre *${[marca, producto].filter(Boolean).join(' ')}*:\n\n`
      : 'Estos son algunos de nuestros productos:\n\n';

    lines.unshift(intro);

    lines.push(
      '¿Quieres consultar otro producto? Solo dime el nombre.\n' +
      'Escribe 0 para volver al menú',
    );

    return lines.join('\n');
  }

  private async handleCategoryQuery(category: string, aiResult: AiIntentResult): Promise<string> {
    const marca = aiResult.parametros?.marca?.toLowerCase() || '';
    const producto = aiResult.parametros?.producto?.toLowerCase() || '';

    const supplies = await this.supplyRepository.find({
      where: { deleted_at: IsNull() },
      relations: ['inventories', 'inventories.branch'],
    });

    let matched = supplies.filter(
      (s) => s.category.toLowerCase() === category,
    );

    if (marca) {
      matched = matched.filter(
        (s) =>
          s.name.toLowerCase().includes(marca) ||
          s.category.toLowerCase().includes(marca),
      );
    }
    if (producto) {
      matched = matched.filter(
        (s) =>
          s.name.toLowerCase().includes(producto) ||
          s.category.toLowerCase().includes(producto),
      );
    }

    if (matched.length === 0) {
      return '';
    }

    const lines: string[] = [];
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    lines.push(`¡Claro! Esto es lo que tenemos en *${categoryLabel}* actualmente:\n`);

    for (const supply of matched.slice(0, 5)) {
      const inventories =
        supply.inventories?.filter((inv) => !inv.deleted_at) || [];
      lines.push(`🎨 *${supply.name}*`);
      if (inventories.length === 0) {
        lines.push('   😕 Sin stock por el momento');
      } else {
        for (const inv of inventories) {
          const emoji = inv.current_quantity > 0 ? '✅' : '❌';
          lines.push(
            `   ${emoji} ${inv.branch?.name || 'Sucursal'}: ${inv.current_quantity} ${supply.unit_of_measure}`,
          );
        }
      }
      lines.push('');
    }

    if (matched.length > 5) {
      lines.push(`...y ${matched.length - 5} productos más\n`);
    }

    lines.push(
      '¿Buscas alguno en particular o te interesa algo más?\n' +
      'Escribe 0 para volver al menú',
    );

    return lines.join('\n');
  }

  private async getHorariosMessage(): Promise<string> {
    const branches = await this.branchRepository.find({
      where: { deleted_at: IsNull() },
      select: ['name', 'opening_hours', 'address', 'location_link'],
    });

    if (branches.length === 0) {
      return 'Horarios de atención - No hay sucursales registradas.';
    }

    const lines = [
      '📍 *Horarios y ubicaciones*\n',
      'Estas son nuestras sucursales:\n',
    ];
    for (const branch of branches) {
      lines.push(`🏪 *${branch.name}*`);
      lines.push(`  🕐 ${branch.opening_hours}`);
      lines.push(`  📫 ${branch.address}`);
      if (branch.location_link) {
        lines.push(`  🔗 ${branch.location_link}`);
      }
      lines.push('');
    }

    lines.push(
      'Además ofrecemos:\n' +
      '• Recarga de cartuchos\n' +
      '• Venta de tintas originales y compatibles\n' +
      '• Mantenimiento de impresoras\n' +
      '• Impresiones color y B/N\n\n' +
      '¡Te esperamos! 😊\n\n' +
      'Escribe 0 para volver al menú',
    );

    return lines.join('\n');
  }

  private async logInteraction(
    phoneNumber: string,
    userMessage: string,
    botResponse: string,
    intention: ChatbotIntention,
  ): Promise<void> {
    const log = this.logRepository.create({
      phone_number: phoneNumber,
      detected_intention: intention,
      user_message: userMessage,
      bot_response: botResponse,
      timestamp: new Date(),
      created_by:
        this.configService.get<string>('SYSTEM_AUDIT_USER_ID') ?? 'chatbot',
    });
    await this.logRepository.save(log);
  }

  private async sendResponse(
    phoneNumber: string,
    message: string,
  ): Promise<void> {
    try {
      console.log(`=== Enviando respuesta a ${phoneNumber} ===`);
      console.log(`Mensaje: ${message.substring(0, 50)}...`);
      const waMessageId = await this.evolutionApiService.sendMessage(
        phoneNumber,
        message,
      );
      await this.conversationService.saveOutgoingMessage({
        phoneNumber,
        messageText: message,
        waMessageId: waMessageId || undefined,
        timestamp: new Date(),
      });
      console.log(`=== Respuesta enviada ===`);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  }

  async findAllLogs(
    limit: number = 10,
    offset: number = 0,
    phoneNumber?: string,
    intention?: string,
  ): Promise<{
    data: ChatbotLog[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const where: any = { deleted_at: IsNull() };

    if (phoneNumber) {
      where.phone_number = phoneNumber;
    }
    if (intention) {
      where.detected_intention = intention;
    }

    const [data, total] = await this.logRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, meta: { total, limit, offset } };
  }
}
