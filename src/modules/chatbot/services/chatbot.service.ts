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
import { Employee } from '../../employee/entities/employee.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { SupplyService, PublicCatalogItem } from '../../supply/supply.service';
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
    private readonly supplyService: SupplyService,
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

    const { data: recentMessages } = await this.conversationService.getMessages(
      phoneNumber,
      { limit: 8, latest: true },
    );
    const recentContext = recentMessages.slice(-8).map((msg) => ({
      role: (msg.from_me ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.content || '',
    }));

    const aiResult = await this.aiService.classifyIntent(message, recentContext);
    const detectedIntention = this.mapAiIntentToLogIntention(aiResult);

    let response = '';
    let newState = session.flow_state;

    if (normalizedMessage === '0') {
      response = this.getCategoryMenu();
      newState = WhatsAppFlowState.SeleccionandoCategoria;
    } else if (['1', '2', '3', '4'].includes(normalizedMessage)) {
      response = await this.getCategoryResponse(normalizedMessage);
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
            response = this.getProductNotFoundMessage(aiResult);
          }
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'CATEGORIA_SERVICIO_TECNICO':
          response = this.getServicioTecnicoMessage();
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'CONSULTAR_PRECIO':
          response = await this.handlePriceQuery(aiResult, message);
          if (!response) {
            response = this.getProductNotFoundMessage(aiResult);
          }
          newState = WhatsAppFlowState.SeleccionandoCategoria;
          break;
        case 'CONSULTAR_STOCK':
          response = await this.handleStockWithAI(aiResult);
          if (!response) {
            response = this.getProductNotFoundMessage(aiResult);
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
          response = await this.searchCatalogByMessage(message, aiResult);
          if (!response) {
            response = this.getClarificationMessage();
          }
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
      CONSULTAR_PRECIO: ChatbotIntention.ConsultarStock,
      CONSULTAR_STOCK: ChatbotIntention.ConsultarStock,
      CONSULTAR_HORARIO: ChatbotIntention.ConsultarHorario,
      MENU: ChatbotIntention.MenuPrincipal,
    };
    return map[aiResult.intencion] || ChatbotIntention.Unknown;
  }

  private getPublicCatalogUrl(): string {
    return this.configService.get<string>('PUBLIC_APP_URL') || 'http://localhost:3001';
  }

  private getClarificationMessage(): string {
    const publicUrl = this.getPublicCatalogUrl();
    return (
      'No encontré ese producto en nuestro catálogo 😔\n\n' +
      'Puedes escribir el nombre exacto del producto o revisar todo aquí:\n' +
      `🔗 ${publicUrl}/\n\n` +
      'Escribe 0 para volver al menú'
    );
  }

  private getServicioTecnicoMessage(): string {
    const publicUrl = this.getPublicCatalogUrl();
    return (
      '*SERVICIO TÉCNICO*\n\n' +
      'Ofrecemos mantenimiento y reparación de impresoras.\n' +
      'Visítanos en nuestras sucursales o escríbenos para coordinar.\n\n' +
      `🔗 ${publicUrl}/\n\n` +
      'Escribe 0 para volver al menú'
    );
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

  private async getCategoryResponse(option: string): Promise<string> {
    const publicUrl = this.getPublicCatalogUrl();
    const catalog = await this.supplyService.findAllPublicCatalog();

    const categoryMap: Record<string, string> = {
      '1': 'tintas',
      '2': 'toner',
      '4': 'repuestos',
    };

    if (option === '3') {
      return this.getServicioTecnicoMessage();
    }

    const categoryKey = categoryMap[option];
    if (!categoryKey) {
      return this.getCategoryMenu();
    }

    const items = catalog.filter((item) =>
      item.category.toLowerCase().includes(categoryKey),
    );

    if (items.length === 0) {
      return (
        `No hay productos de *${categoryKey}* en el catálogo por ahora.\n\n` +
        `🔗 Ver catálogo: ${publicUrl}/\n\n` +
        'Escribe 0 para volver al menú'
      );
    }

    const title = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
    const lines = [`*${title.toUpperCase()}* — catálogo disponible:\n`];

    for (const item of items.slice(0, 8)) {
      lines.push(...this.formatCatalogItemBlock(item));
    }

    if (items.length > 8) {
      lines.push(`...y ${items.length - 8} productos más en el catálogo\n`);
    }

    lines.push(
      `🔗 *Ver catálogo completo:*\n${publicUrl}/\n\n` +
      'Escribe 0 para volver al menú',
    );

    return lines.join('\n');
  }

  private formatPrice(value: number | string): string {
    const amount = Number(value) || 0;
    return `Bs ${amount.toFixed(2)}`;
  }

  private getProductNotFoundMessage(aiResult: AiIntentResult): string {
    const publicUrl = this.getPublicCatalogUrl();
    const marca = aiResult.parametros?.marca;
    const producto = aiResult.parametros?.producto;
    const ref = [marca, producto].filter(Boolean).join(' ');

    return (
      `No encontré *${ref || 'ese producto'}* en nuestro catálogo actual 😔\n\n` +
      'Puedes indicarme el nombre exacto del producto o revisar todo aquí:\n' +
      `🔗 ${publicUrl}/\n\n` +
      'Escribe 0 para volver al menú'
    );
  }

  private async loadPublicCatalog(): Promise<PublicCatalogItem[]> {
    return this.supplyService.findAllPublicCatalog();
  }

  private catalogMatchesSearch(
    item: PublicCatalogItem,
    marca: string,
    producto: string,
    extraTerms: string[] = [],
  ): boolean {
    const haystack = [
      item.name,
      item.category,
      item.brand,
      item.code,
      item.compatibility,
      item.commercial_description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const terms = [
      ...extraTerms,
      ...(marca ? marca.split(/\s+/) : []),
      ...(producto ? producto.split(/\s+/) : []),
    ]
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 1);

    if (terms.length === 0) return true;

    const matchedTerms = terms.filter((term) => haystack.includes(term));
    return matchedTerms.length >= Math.min(terms.length, Math.max(1, Math.ceil(terms.length * 0.6)));
  }

  private formatCatalogItemBlock(
    item: PublicCatalogItem,
    options: { showPrice?: boolean; showStock?: boolean; prefix?: string } = {},
  ): string[] {
    const { showPrice = true, showStock = true, prefix = '🎨' } = options;
    const publicUrl = this.getPublicCatalogUrl();
    const lines: string[] = [];

    lines.push(`${prefix} *${item.name}*`);

    if (item.brand) {
      lines.push(`   🏷️ Marca: ${item.brand}`);
    }

    if (showPrice) {
      lines.push(`   💰 Precio: *${this.formatPrice(item.sale_price)}*`);
    }

    if (showStock) {
      if (item.stock_by_branch.length === 0) {
        lines.push('   😕 Sin stock por el momento');
      } else {
        for (const stock of item.stock_by_branch) {
          const emoji = stock.quantity > 0 ? '✅' : '❌';
          lines.push(
            `   ${emoji} ${stock.branch_name}: ${stock.quantity} ${item.unit_of_measure}`,
          );
        }
      }
    }

    if (item.compatibility) {
      lines.push(`   🔧 Compatible: ${item.compatibility}`);
    }

    if (item.commercial_description) {
      const desc = item.commercial_description.length > 120
        ? `${item.commercial_description.slice(0, 117)}...`
        : item.commercial_description;
      lines.push(`   📝 ${desc}`);
    }

    lines.push(`   🔗 ${publicUrl}/producto/${item.id}`);
    lines.push('');
    return lines;
  }

  private filterCatalogItems(
    catalog: PublicCatalogItem[],
    aiResult: AiIntentResult,
    category?: string,
    rawMessage?: string,
  ): PublicCatalogItem[] {
    const marca = aiResult.parametros?.marca?.toLowerCase() || '';
    const producto = aiResult.parametros?.producto?.toLowerCase() || '';
    const extraTerms = rawMessage
      ? rawMessage
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 2 && !['para', 'quiero', 'tengo', 'tienes', 'tinta', 'toner', 'precio', 'cuanto', 'cuesta'].includes(t))
      : [];

    let matched = catalog;

    if (category) {
      matched = matched.filter((item) =>
        item.category.toLowerCase().includes(category.toLowerCase()),
      );
    }

    if (marca || producto || extraTerms.length > 0) {
      matched = matched.filter((item) =>
        this.catalogMatchesSearch(item, marca, producto, extraTerms),
      );
    }

    return matched;
  }

  private async searchCatalogByMessage(
    message: string,
    aiResult: AiIntentResult,
  ): Promise<string> {
    const catalog = await this.loadPublicCatalog();
    const matched = this.filterCatalogItems(catalog, aiResult, undefined, message);

    if (matched.length === 0) {
      return '';
    }

    const lines: string[] = ['Esto es lo que encontré en nuestro catálogo:\n'];
    for (const item of matched.slice(0, 5)) {
      lines.push(...this.formatCatalogItemBlock(item, { showPrice: true, showStock: true }));
    }

    if (matched.length > 5) {
      lines.push(`...y ${matched.length - 5} productos más\n`);
    }

    lines.push(
      `🔗 Ver catálogo completo: ${this.getPublicCatalogUrl()}/\n\n` +
      'Escribe 0 para volver al menú',
    );

    return lines.join('\n');
  }

  private async handlePriceQuery(
    aiResult: AiIntentResult,
    rawMessage: string,
  ): Promise<string> {
    const catalog = await this.loadPublicCatalog();
    const matched = this.filterCatalogItems(catalog, aiResult, undefined, rawMessage);

    if (matched.length === 0) {
      return '';
    }

    const lines: string[] = [];
    const ref = [aiResult.parametros?.marca, aiResult.parametros?.producto]
      .filter(Boolean)
      .join(' ');

    lines.push(
      ref
        ? `Estos son los precios del catálogo para *${ref}*:\n`
        : 'Estos son los precios de nuestro catálogo:\n',
    );

    for (const item of matched.slice(0, 5)) {
      lines.push(...this.formatCatalogItemBlock(item, { showPrice: true, showStock: true }));
    }

    if (matched.length > 5) {
      lines.push(`...y ${matched.length - 5} productos más\n`);
    }

    lines.push(
      '¿Te interesa alguno? Puedes pedirlo por aquí o ver el detalle en el enlace.\n' +
      'Escribe 0 para volver al menú',
    );

    return lines.join('\n');
  }

  private async handleStockWithAI(aiResult: AiIntentResult): Promise<string> {
    const catalog = await this.loadPublicCatalog();
    const matched = this.filterCatalogItems(catalog, aiResult);

    if (matched.length === 0) {
      return '';
    }

    const lines: string[] = [];
    const marca = aiResult.parametros?.marca || '';
    const producto = aiResult.parametros?.producto || '';

    const intro = marca || producto
      ? `Disponibilidad en catálogo para *${[marca, producto].filter(Boolean).join(' ')}*:\n\n`
      : 'Estos son algunos productos de nuestro catálogo:\n\n';

    lines.push(intro);

    for (const item of matched.slice(0, 5)) {
      lines.push(...this.formatCatalogItemBlock(item, { showPrice: true, showStock: true, prefix: '•' }));
    }

    lines.push(
      '¿Quieres consultar otro producto? Solo dime el nombre.\n' +
      'Escribe 0 para volver al menú',
    );

    return lines.join('\n');
  }

  private async handleCategoryQuery(category: string, aiResult: AiIntentResult): Promise<string> {
    const catalog = await this.loadPublicCatalog();
    const matched = this.filterCatalogItems(catalog, aiResult, category);

    if (matched.length === 0) {
      return '';
    }

    const lines: string[] = [];
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    lines.push(`*${categoryLabel}* — productos disponibles en catálogo:\n`);

    for (const item of matched.slice(0, 5)) {
      lines.push(...this.formatCatalogItemBlock(item, { showPrice: true, showStock: true }));
    }

    if (matched.length > 5) {
      lines.push(`...y ${matched.length - 5} productos más\n`);
    }

    lines.push(
      `🔗 Ver catálogo: ${this.getPublicCatalogUrl()}/\n\n` +
      '¿Buscas alguno en particular? Escribe el nombre.\n' +
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
      created_by: '00000000-0000-4000-8000-000000000001',
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
