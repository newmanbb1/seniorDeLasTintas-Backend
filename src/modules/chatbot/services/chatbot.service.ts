import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { WhatsAppSession, WhatsAppFlowState } from "../entities/whatsapp-session.entity";
import { ChatbotLog, ChatbotIntention } from "../entities/chatbot-log.entity";
import { Branch } from "../../branch/entities/branch.entity";
import { Inventory } from "../../inventory/entities/inventory.entity";
import { Supply } from "../../supply/entities/supply.entity";
import { Employee } from "../../employee/entities/employee.entity";
import { Attendance } from "../../attendance/entities/attendance.entity";
import { EvolutionApiService } from "./evolution-api.service";
import { WhatsAppSessionService } from "./whatsapp-session.service";

interface ChatbotContext {
  searchTerm?: string;
  [key: string]: any;
}

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
  ) {}

  async processMessage(phoneNumber: string, message: string, pushName?: string): Promise<void> {
    const session = await this.sessionService.getOrCreateSession(phoneNumber, pushName);
    const normalizedMessage = message.trim().toLowerCase();
    const detectedIntention = this.detectIntention(normalizedMessage);

    let response = "";
    let newState = session.flow_state;

    if (normalizedMessage === "0") {
      response = this.getMenuMessage();
      newState = WhatsAppFlowState.MenuPrincipal;
    } else {
      switch (session.flow_state) {
        case WhatsAppFlowState.MenuPrincipal: {
          const result = await this.handleMenuOption(normalizedMessage, message);
          response = result.response;
          newState = result.newState;
          break;
        }

        case WhatsAppFlowState.ConsultarStock:
          response = await this.handleStockConsultation(normalizedMessage, session);
          newState = WhatsAppFlowState.ConsultarStock;
          break;

        case WhatsAppFlowState.ConsultarAsistencia:
          response = await this.handleAttendanceConsultation(normalizedMessage, session);
          newState = WhatsAppFlowState.ConsultarAsistencia;
          break;

        case WhatsAppFlowState.Horarios:
          response = await this.getHorariosMessage();
          newState = WhatsAppFlowState.MenuPrincipal;
          break;

        default:
          response = this.getMenuMessage();
          newState = WhatsAppFlowState.MenuPrincipal;
      }
    }

    if (!response) {
      response = this.getMenuMessage();
      newState = WhatsAppFlowState.MenuPrincipal;
    }

    await this.logInteraction(phoneNumber, message, response, detectedIntention);
    await this.sendResponse(phoneNumber, response);
    await this.sessionService.updateFlowState(phoneNumber, newState);
  }

  private getMenuMessage(): string {
    return "le habla *Señor de las Tintas*\n\n" +
      "Como te podemos ayudar?\n\n" +
      "1 - Consultar todo el stock\n" +
      "2 - Horarios y servicios\n" +
      "0 - Menu principal\n\n" +
      "Responde con el numero de tu opcion";
  }

  private async handleMenuOption(
    option: string,
    originalMessage?: string,
  ): Promise<{ response: string; newState: WhatsAppFlowState }> {
    switch (option) {
      case "1":
        return {
          response: await this.getStockMessage(),
          newState: WhatsAppFlowState.MenuPrincipal,
        };

      case "2":
        return {
          response: await this.getHorariosMessage(),
          newState: WhatsAppFlowState.MenuPrincipal,
        };

      default:
        const intention = this.detectIntention(originalMessage?.toLowerCase() || option);
        switch (intention) {
          case ChatbotIntention.ConsultarStock:
            return {
              response: "Stock - Que tinta o producto deseas consultar?\nEjemplo: Canon, Epson, HP\n\nEscribe 0 para volver al menu",
              newState: WhatsAppFlowState.ConsultarStock,
            };
          case ChatbotIntention.ConsultarHorario:
            return {
              response: await this.getHorariosMessage(),
              newState: WhatsAppFlowState.MenuPrincipal,
            };
          case ChatbotIntention.ConsultarAsistencia:
            return {
              response: "Asistencia - Por favor, ingresa el nombre del empleado para consultar su asistencia\n\nEscribe 0 para volver al menu",
              newState: WhatsAppFlowState.ConsultarAsistencia,
            };
          default:
            return {
              response: this.getMenuMessage(),
              newState: WhatsAppFlowState.MenuPrincipal,
            };
        }
    }
  }

  private async getHorariosMessage(): Promise<string> {
    const branches = await this.branchRepository.find({
      where: { deleted_at: IsNull() },
      select: ["name", "opening_hours", "address", "location_link"],
    });

    if (branches.length === 0) {
      return "Horarios de atencion - No hay sucursales registradas.";
    }

    const lines = ["Horarios de atencion:\n"];
    for (const branch of branches) {
      lines.push(`${branch.name} - ${branch.opening_hours}`);
      lines.push(`Direccion: ${branch.address}`);
      lines.push(`Link: ${branch.location_link || 'Sin link'}\n`);
    }

    lines.push(
      "\nServicios disponibles:\n" +
      "- Recarga de cartuchos\n" +
      "- Venta de tintas originales y compatibles\n" +
      "- Mantenimiento de impresoras\n" +
      "- Impresiones color y B/N\n\n" +
      "Escribe 0 para volver al menu"
    );

    return lines.join("\n");
  }

  private async getStockMessage(): Promise<string> {
    const inventory = await this.inventoryRepository
      .createQueryBuilder("inv")
      .innerJoinAndSelect("inv.supply", "supply")
      .innerJoinAndSelect("inv.branch", "branch")
      .where("inv.current_quantity > 0")
      .andWhere("inv.deleted_at IS NULL")
      .andWhere("supply.deleted_at IS NULL")
      .orderBy("supply.name", "ASC")
      .getMany();

    if (inventory.length === 0) {
      return "Stock - No hay productos en inventario.";
    }

    const lines = ["📦 *Stock de Productos*\n"];
    
    const grouped = inventory.reduce((acc, inv) => {
      const name = inv.supply.name;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(inv);
      return acc;
    }, {} as Record<string, typeof inventory>);

    for (const [supplyName, items] of Object.entries(grouped)) {
      lines.push(`\n*${supplyName}*`);
      for (const inv of items) {
        lines.push(`  - ${inv.branch.name}: ${inv.current_quantity} unidades`);
      }
    }

    lines.push("\n\nEscribe 0 para volver al menu");
    return lines.join("\n");
  }

  private async handleStockConsultation(message: string, session: WhatsAppSession): Promise<string> {
    if (message === "0") {
      return this.getMenuMessage();
    }

    const supplies = await this.supplyRepository.find({
      where: { deleted_at: IsNull() },
      relations: ["inventories", "inventories.branch"],
    });

    const matchedSupplies = supplies.filter(supply =>
      supply.name.toLowerCase().includes(message) ||
      supply.category.toLowerCase().includes(message)
    );

    if (matchedSupplies.length === 0) {
      return `No encontre productos que coincidan con "${message}"\n\nIntenta con otra marca o nombre (Canon, Epson, HP, tinta, etc.)\nEscribe 0 para volver al menu`;
    }

    const lines: string[] = [];
    for (const supply of matchedSupplies.slice(0, 3)) {
      const inventories = supply.inventories?.filter(inv => !inv.deleted_at) || [];
      
      lines.push(`${supply.name} (${supply.category})`);
      
      if (inventories.length === 0) {
        lines.push("  Sin stock disponible\n");
      } else {
        for (const inv of inventories) {
          lines.push(`  ${inv.branch?.name || 'Sucursal'}: ${inv.current_quantity} ${supply.unit_of_measure}`);
        }
      }
      lines.push("");
    }

    lines.push("Deseas consultar otro producto? Escribe el nombre\nEscribe 0 para volver al menu");

    return lines.join("\n");
  }

  private async handleAttendanceConsultation(message: string, session: WhatsAppSession): Promise<string> {
    if (message === "0") {
      return this.getMenuMessage();
    }

    const employees = await this.employeeRepository.find({
      where: { deleted_at: IsNull(), active: true },
      relations: ["branch"],
    });

    const matchedEmployees = employees.filter(emp =>
      emp.full_name.toLowerCase().includes(message)
    );

    if (matchedEmployees.length === 0) {
      return `No encontre empleados que coincidan con "${message}"\n\nIntenta con otro nombre\nEscribe 0 para volver al menu`;
    }

    const employee = matchedEmployees[0];
    const today = new Date().toISOString().split("T")[0];
    
    const todayAttendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employee.id },
        register_date: today,
      },
    });

    const thisMonthAttendances = await this.attendanceRepository
      .createQueryBuilder("attendance")
      .where("attendance.employee_id = :employeeId", { employeeId: employee.id })
      .andWhere("attendance.register_date >= :startDate AND attendance.register_date < :endDate", {
        startDate: `${today.slice(0, 7)}-01`,
        endDate: `${today.slice(0, 7)}-31`,
      })
      .getMany();

    const punctualCount = thisMonthAttendances.filter(a => a.check_in_status === "punctual").length;
    const lateCount = thisMonthAttendances.filter(a => a.check_in_status === "late").length;

    const lines = [
      `${employee.full_name}`,
      `Sucursal: ${employee.branch?.name || 'Sin asignar'}`,
      `Fecha: ${today}`,
      "",
    ];

    if (todayAttendance) {
      lines.push(`Ingreso: ${new Date(todayAttendance.check_in).toLocaleTimeString()}`);
      if (todayAttendance.check_out) {
        lines.push(`Salida: ${new Date(todayAttendance.check_out).toLocaleTimeString()}`);
        lines.push(`Horas trabajadas: ${todayAttendance.hours_worked}`);
      } else {
        lines.push("Aun trabajando...");
      }
    } else {
      lines.push("Sin registro de entrada hoy");
    }

    lines.push("");
    lines.push(`Este mes:`);
    lines.push(`  Puntuales: ${punctualCount}`);
    lines.push(`  Tardes: ${lateCount}`);
    lines.push(`  Dias trabajados: ${thisMonthAttendances.length}`);
    lines.push("");
    lines.push("Escribe 0 para volver al menu");

    return lines.join("\n");
  }

  private async handleHorarios(message: string): Promise<string> {
    if (message === "0") {
      await this.sessionService.resetToMenu("test");
      return this.getMenuMessage();
    }
    return await this.getHorariosMessage();
  }

  private detectIntention(message: string): ChatbotIntention {
    if (message.match(/stock|tinta|canon|epson|hp|producto|consultar/i)) {
      return ChatbotIntention.ConsultarStock;
    }
    if (message.match(/horario|ubicacion|address|sucursal|atencion|services/i)) {
      return ChatbotIntention.ConsultarHorario;
    }
    if (message.match(/asistencia|empleado|entrada|salida|trabaj/i)) {
      return ChatbotIntention.ConsultarAsistencia;
    }
    if (message.match(/^[0-9]+$/)) {
      return ChatbotIntention.MenuPrincipal;
    }
    return ChatbotIntention.Unknown;
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
      created_by: this.configService.get<string>("SYSTEM_AUDIT_USER_ID") ?? "chatbot",
    });
    await this.logRepository.save(log);
  }

  private async sendResponse(phoneNumber: string, message: string): Promise<void> {
    try {
      console.log(`=== Enviando respuesta a ${phoneNumber} ===`);
      console.log(`Mensaje: ${message.substring(0, 50)}...`);
      await this.evolutionApiService.sendMessage(phoneNumber, message);
      console.log(`=== Respuesta enviada ===`);
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
    }
  }

  async findAllLogs(
    limit: number = 10,
    offset: number = 0,
    phoneNumber?: string,
    intention?: string,
  ): Promise<{ data: ChatbotLog[]; meta: { total: number; limit: number; offset: number } }> {
    const where: any = { deleted_at: IsNull() };

    if (phoneNumber) {
      where.phone_number = phoneNumber;
    }
    if (intention) {
      where.detected_intention = intention;
    }

    const [data, total] = await this.logRepository.findAndCount({
      where,
      order: { timestamp: "DESC" },
      take: limit,
      skip: offset,
    });

    return { data, meta: { total, limit, offset } };
  }
}