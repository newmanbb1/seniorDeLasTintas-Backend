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
    
    await this.logInteraction(phoneNumber, message, "", this.detectIntention(normalizedMessage));

    if (normalizedMessage === "0") {
      await this.sessionService.resetToMenu(phoneNumber);
      const response = this.getMenuMessage();
      await this.sendResponse(phoneNumber, response);
      return;
    }

    let response = "";
    let newState = session.flow_state;

    switch (session.flow_state) {
      case WhatsAppFlowState.MenuPrincipal:
        response = await this.handleMenuOption(normalizedMessage);
        if (response) {
          const stateMatch = response.match(/STATE:(\w+)/);
          if (stateMatch) {
            newState = stateMatch[1] as WhatsAppFlowState;
            response = response.replace(/STATE:\w+/, "");
          }
        }
        break;

      case WhatsAppFlowState.ConsultarStock:
        response = await this.handleStockConsultation(normalizedMessage, session);
        break;

      case WhatsAppFlowState.ConsultarAsistencia:
        response = await this.handleAttendanceConsultation(normalizedMessage, session);
        break;

      case WhatsAppFlowState.Horarios:
        response = await this.handleHorarios(normalizedMessage);
        break;

      default:
        response = this.getMenuMessage();
        newState = WhatsAppFlowState.MenuPrincipal;
    }

    if (response) {
      await this.sendResponse(phoneNumber, response);
      await this.sessionService.updateFlowState(phoneNumber, newState);
    }
  }

  private getMenuMessage(): string {
    return "Hola *Señor de las Tintas*\n\n" +
      "Como te podemos ayudar?\n\n" +
      "1 - Consultar stock de tintas\n" +
      "2 - Horarios y servicios\n" +
      "3 - Consulta de asistencia\n" +
      "0 - Menu principal\n\n" +
      "Responde con el numero de tu opcion";
  }

  private async handleMenuOption(option: string): Promise<string> {
    const optionMap: Record<string, { response: string; state: WhatsAppFlowState }> = {
      "1": { 
        response: "Stock - Que tinta o producto deseas consultar?\nEjemplo: Canon, Epson, HP\n\nEscribe 0 para volver al menu", 
        state: WhatsAppFlowState.ConsultarStock 
      },
      "2": { 
        response: await this.getHorariosMessage(), 
        state: WhatsAppFlowState.MenuPrincipal 
      },
      "3": { 
        response: "Asistencia - Por favor, ingresa el nombre del empleado para consultar su asistencia\n\nEscribe 0 para volver al menu", 
        state: WhatsAppFlowState.ConsultarAsistencia 
      },
    };

    const selected = optionMap[option];
    if (selected) {
      return selected.response + `\nSTATE:${selected.state}`;
    }

    return this.getMenuMessage() + `\nSTATE:${WhatsAppFlowState.MenuPrincipal}`;
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

  private async handleStockConsultation(message: string, session: WhatsAppSession): Promise<string> {
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
      .andWhere("attendance.register_date LIKE :month", { month: `${today.slice(0, 7)}%` })
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
      await this.evolutionApiService.sendMessage(phoneNumber, message);
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