import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, LessThanOrEqual, Repository } from 'typeorm';
import {
  Attendance,
  AttendanceEntryStatus,
} from './entities/attendance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Branch } from '../branch/entities/branch.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { FilterAttendance } from './dto/filter-attendance.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { UserRole } from '../auth/entities/user.entity';
import { EmployeePinService } from '../../common/services/employee-pin.service';

export interface UserContext {
  userId: string;
  role: string;
  branch_id?: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly configService: ConfigService,
    private readonly employeePinService: EmployeePinService,
  ) {}

  private getSystemUserId(): string {
    return (
      this.configService.get<string>('SYSTEM_AUDIT_USER_ID') ??
      '00000000-0000-4000-8000-000000000001'
    );
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getCurrentTimestamp(): Date {
    return new Date();
  }

  private calculateHoursWorked(checkIn: Date, checkOut: Date): string {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return hours.toFixed(2);
  }

  private determineStatus(checkIn: Date): AttendanceEntryStatus {
    const hour = checkIn.getHours();
    const minute = checkIn.getMinutes();
    const checkInTime = hour * 60 + minute;
    const limitTime = 9 * 60;

    if (checkInTime <= limitTime) {
      return AttendanceEntryStatus.Punctual;
    }
    return AttendanceEntryStatus.Late;
  }

  private isSecretaria(role: string): boolean {
    return role === UserRole.SECRETARIA;
  }

  async checkIn(dto: CreateAttendanceDto, clientIp?: string): Promise<Attendance> {
    const { employee_id, pin } = dto;

    const employee = await this.employeePinService.verifyPinForEmployee(
      employee_id,
      pin,
      clientIp,
    );

    const today = this.getCurrentDate();
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employee_id },
        register_date: today,
      },
    });

    if (existingAttendance && !existingAttendance.deleted_at) {
      throw new ConflictException(
        `Ya existe un registro de entrada para hoy. Hora de ingreso: ${existingAttendance.check_in}`,
      );
    }

    const checkInTime = this.getCurrentTimestamp();
    const status = this.determineStatus(checkInTime);

    const attendance = this.attendanceRepository.create({
      employee,
      register_date: today,
      check_in: checkInTime,
      check_in_status: status,
      check_out: null,
      hours_worked: '0',
      created_by: this.getSystemUserId(),
    });

    return this.attendanceRepository.save(attendance);
  }

  async checkOut(dto: CheckOutDto, clientIp?: string): Promise<Attendance> {
    const { employee_id, pin } = dto;

    await this.employeePinService.verifyPinForEmployee(
      employee_id,
      pin,
      clientIp,
    );

    const today = this.getCurrentDate();
    const attendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employee_id },
        register_date: today,
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        'No existe registro de entrada para hoy. Debe registrar entrada primero.',
      );
    }

    if (attendance.check_out) {
      throw new ConflictException(
        `Ya has registrado tu salida hoy a las ${attendance.check_out}`,
      );
    }

    const checkOutTime = this.getCurrentTimestamp();
    const hoursWorked = this.calculateHoursWorked(
      attendance.check_in,
      checkOutTime,
    );

    attendance.check_out = checkOutTime;
    attendance.hours_worked = hoursWorked;
    attendance.updated_by = this.getSystemUserId();

    return this.attendanceRepository.save(attendance);
  }

  private async assertActiveEmployee(
    employeeId: string,
    clientIp?: string,
  ): Promise<Employee> {
    this.employeePinService.validateIpAccess(clientIp);

    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, active: true, deleted_at: IsNull() },
      relations: ['branch'],
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado o inactivo');
    }

    return employee;
  }

  async getTodayStatus(employeeId: string): Promise<{
    register_date: string;
    has_check_in: boolean;
    has_check_out: boolean;
    check_in: Date | null;
    check_out: Date | null;
    check_in_status: AttendanceEntryStatus | null;
    hours_worked: string | null;
  }> {
    const today = this.getCurrentDate();
    const attendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employeeId },
        register_date: today,
        deleted_at: IsNull(),
      },
    });

    return {
      register_date: today,
      has_check_in: !!attendance,
      has_check_out: !!attendance?.check_out,
      check_in: attendance?.check_in ?? null,
      check_out: attendance?.check_out ?? null,
      check_in_status: attendance?.check_in_status ?? null,
      hours_worked: attendance?.hours_worked ?? null,
    };
  }

  async checkInSelf(employeeId: string, clientIp?: string): Promise<Attendance> {
    const employee = await this.assertActiveEmployee(employeeId, clientIp);

    const today = this.getCurrentDate();
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employeeId },
        register_date: today,
      },
    });

    if (existingAttendance && !existingAttendance.deleted_at) {
      throw new ConflictException(
        `Ya existe un registro de entrada para hoy. Hora de ingreso: ${existingAttendance.check_in}`,
      );
    }

    const checkInTime = this.getCurrentTimestamp();
    const status = this.determineStatus(checkInTime);

    const attendance = this.attendanceRepository.create({
      employee,
      register_date: today,
      check_in: checkInTime,
      check_in_status: status,
      check_out: null,
      hours_worked: '0',
      created_by: this.getSystemUserId(),
    });

    return this.attendanceRepository.save(attendance);
  }

  async checkOutSelf(employeeId: string, clientIp?: string): Promise<Attendance> {
    await this.assertActiveEmployee(employeeId, clientIp);

    const today = this.getCurrentDate();
    const attendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employeeId },
        register_date: today,
      },
    });

    if (!attendance || attendance.deleted_at) {
      throw new NotFoundException(
        'No existe registro de entrada para hoy. Debe registrar entrada primero.',
      );
    }

    if (attendance.check_out) {
      throw new ConflictException(
        `Ya has registrado tu salida hoy a las ${attendance.check_out}`,
      );
    }

    const checkOutTime = this.getCurrentTimestamp();
    attendance.check_out = checkOutTime;
    attendance.hours_worked = this.calculateHoursWorked(
      attendance.check_in,
      checkOutTime,
    );
    attendance.updated_by = this.getSystemUserId();

    return this.attendanceRepository.save(attendance);
  }

  async findAll(
    filters: FilterAttendance,
    userContext?: UserContext,
  ): Promise<{
    data: Attendance[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const {
      limit = 10,
      offset = 0,
      employee_id,
      register_date,
      check_in_status,
      branch_id,
    } = filters;

    const where: any = { deleted_at: IsNull() };

    if (userContext && this.isSecretaria(userContext.role)) {
      where.employee = { branch: { id: userContext.branch_id } };
    } else {
      if (employee_id) {
        where.employee = { id: employee_id };
      }
      if (branch_id) {
        where.employee = { ...where.employee, branch: { id: branch_id } };
      }
    }
    if (register_date) {
      where.register_date = register_date;
    }
    if (check_in_status) {
      where.check_in_status = check_in_status;
    }

    const [data, total] = await this.attendanceRepository.findAndCount({
      where,
      relations: ['employee', 'employee.branch'],
      take: limit,
      skip: offset,
      order: { register_date: 'DESC', check_in: 'DESC' },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string, userContext?: UserContext): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['employee', 'employee.branch'],
    });
    if (!attendance) {
      throw new NotFoundException(`Asistencia con ID "${id}" no encontrada`);
    }

    if (userContext && this.isSecretaria(userContext.role)) {
      if (attendance.employee.branch.id !== userContext.branch_id) {
        throw new ForbiddenException('No tienes acceso a esta asistencia');
      }
    }

    return attendance;
  }

  async update(
    id: string,
    dto: UpdateAttendanceDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<Attendance> {
    const attendance = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      throw new ForbiddenException(
        'Las secretarias no pueden modificar assistencias',
      );
    }

    attendance.updated_by = userId;
    return this.attendanceRepository.save(attendance);
  }

  async remove(
    id: string,
    userId: string,
    userContext?: UserContext,
  ): Promise<{ id: string; deleted: true }> {
    const attendance = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      throw new ForbiddenException(
        'Las secretarias no pueden eliminar assistencias',
      );
    }

    await this.attendanceRepository.update(
      { id },
      {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    );
    return { id, deleted: true };
  }

  async getReportByEmployee(
    employee_id: string,
    startDate?: string,
    endDate?: string,
    userContext?: UserContext,
  ): Promise<{ data: Attendance[]; summary: any }> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employee_id, deleted_at: IsNull() },
      relations: ['branch'],
    });

    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID "${employee_id}" no encontrado`,
      );
    }

    if (userContext && this.isSecretaria(userContext.role)) {
      if (employee.branch.id !== userContext.branch_id) {
        throw new ForbiddenException(
          'No tienes acceso a los reportes de este empleado',
        );
      }
    }

    const where: any = {
      employee: { id: employee_id },
      deleted_at: IsNull(),
    };

    if (startDate) {
      where.register_date = MoreThanOrEqual(startDate);
    }
    if (endDate) {
      where.register_date = LessThanOrEqual(endDate);
    }

    const data = await this.attendanceRepository.find({
      where,
      order: { register_date: 'DESC' },
    });

    const punctualCount = data.filter(
      (a) => a.check_in_status === AttendanceEntryStatus.Punctual,
    ).length;
    const lateCount = data.filter(
      (a) => a.check_in_status === AttendanceEntryStatus.Late,
    ).length;

    const totalHours = data.reduce(
      (sum, a) => sum + parseFloat(a.hours_worked || '0'),
      0,
    );

    const summary = {
      employee_name: employee.full_name,
      branch_name: employee.branch?.name,
      total_days: data.length,
      punctual_days: punctualCount,
      late_days: lateCount,
      total_hours: totalHours.toFixed(2),
      average_hours:
        data.length > 0 ? (totalHours / data.length).toFixed(2) : '0',
    };

    return { data, summary };
  }
}
