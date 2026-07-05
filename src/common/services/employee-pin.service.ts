import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as ipaddr from 'ipaddr.js';
import { Employee } from '../../modules/employee/entities/employee.entity';

@Injectable()
export class EmployeePinService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly configService: ConfigService,
  ) {}

  validateIpAccess(clientIp?: string): void {
    if (!clientIp) {
      return;
    }

    const allowedIps = this.configService.get<string>('ALLOWED_IPS', '');
    if (!allowedIps || allowedIps.trim() === '') {
      return;
    }

    const addr = ipaddr.parse(clientIp);
    const ranges = allowedIps.split(',').map((r) => r.trim()).filter(Boolean);

    const isAllowed = ranges.some((cidr) => {
      try {
        const range = ipaddr.parseCIDR(cidr);
        return addr.match(range);
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      throw new ForbiddenException(
        'Acceso permitido solo desde la red WiFi de la empresa',
      );
    }
  }

  async verifyPinForEmployee(
    employeeId: string,
    pin: string,
    clientIp?: string,
  ): Promise<Employee> {
    this.validateIpAccess(clientIp);

    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, deleted_at: IsNull() },
      relations: ['branch'],
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con ID "${employeeId}" no encontrado`);
    }

    if (!employee.active) {
      throw new ForbiddenException('El empleado está inactivo');
    }

    const now = new Date();
    if (employee.locked_until && employee.locked_until > now) {
      throw new UnauthorizedException('PIN inválido o empleado inactivo');
    }

    const isPinValid = await bcrypt.compare(pin, employee.access_pin);
    if (!isPinValid) {
      await this.recordFailedAttempt(employee);
      throw new UnauthorizedException('PIN inválido o empleado inactivo');
    }

    await this.resetLockout(employee.id);
    return employee;
  }

  async loginWithPin(
    pin: string,
    clientIp?: string,
  ): Promise<Employee> {
    this.validateIpAccess(clientIp);

    const now = new Date();
    const employees = await this.employeeRepository.find({
      where: { active: true, deleted_at: IsNull() },
      relations: ['branch'],
    });

    let matchedEmployee: Employee | null = null;
    const failedIds: string[] = [];

    for (const emp of employees) {
      if (emp.locked_until && emp.locked_until > now) {
        continue;
      }
      const isMatch = await bcrypt.compare(pin, emp.access_pin);
      if (isMatch) {
        matchedEmployee = emp;
        break;
      }
      failedIds.push(emp.id);
    }

    if (!matchedEmployee) {
      for (const empId of failedIds) {
        const emp = employees.find((e) => e.id === empId);
        if (emp) {
          await this.recordFailedAttempt(emp);
        }
      }
      throw new UnauthorizedException('PIN inválido o empleado inactivo');
    }

    await this.resetLockout(matchedEmployee.id);
    return matchedEmployee;
  }

  private async recordFailedAttempt(employee: Employee): Promise<void> {
    await this.employeeRepository.increment(
      { id: employee.id },
      'failed_attempts',
      1,
    );

    if (employee.failed_attempts + 1 >= this.MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(
        Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
      await this.employeeRepository.update(
        { id: employee.id },
        { locked_until: lockedUntil },
      );
    }
  }

  private async resetLockout(employeeId: string): Promise<void> {
    await this.employeeRepository.update(
      { id: employeeId },
      { failed_attempts: 0, locked_until: null },
    );
  }
}
