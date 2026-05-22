import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Like, Repository } from "typeorm";
import { Employee } from "./entities/employee.entity";
import { Branch } from "../branch/entities/branch.entity";
import { Attendance } from "../attendance/entities/attendance.entity";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { FilterEmployee } from "./dto/filter-employee.dto";
import { UserRole } from "../auth/entities/user.entity";

export interface UserContext {
  userId: string;
  role: string;
  branch_id?: string;
}

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  private isSecretaria(role: string): boolean {
    return role === UserRole.SECRETARIA;
  }

  async create(dto: CreateEmployeeDto, userId: string, userContext?: UserContext): Promise<Employee> {
    const { full_name, branch_id } = dto;

    if (userContext && this.isSecretaria(userContext.role)) {
      if (branch_id !== userContext.branch_id) {
        throw new ForbiddenException('Solo puedes crear empleados para tu sucursal');
      }
    }

    const existingEmployee = await this.employeeRepository.findOne({
      where: { full_name, deleted_at: IsNull() },
    });
    if (existingEmployee) {
      throw new ConflictException(
        `Ya existe un empleado con el nombre "${full_name}".`,
      );
    }

    const branch = await this.branchRepository.findOne({
      where: { id: branch_id, deleted_at: IsNull() },
    });
    if (!branch) {
      throw new NotFoundException(
        `La sucursal con ID "${branch_id}" no existe o está eliminada.`,
      );
    }

    const employee = this.employeeRepository.create({
      ...dto,
      created_by: userId,
    });
    return this.employeeRepository.save(employee);
  }

  async findAll(
    filters: FilterEmployee,
    userContext?: UserContext,
  ): Promise<{ data: Employee[]; meta: { total: number; limit: number; offset: number } }> {
    const { limit = 10, offset = 0, full_name, position, branch_id, active } =
      filters;

    const where: any = { deleted_at: IsNull() };

    if (userContext && this.isSecretaria(userContext.role)) {
      where.branch = { id: userContext.branch_id };
    } else if (branch_id) {
      where.branch = { id: branch_id };
    }
    if (full_name) {
      where.full_name = Like(`%${full_name}%`);
    }
    if (position) {
      where.position = Like(`%${position}%`);
    }
    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await this.employeeRepository.findAndCount({
      where,
      relations: ["branch"],
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string, userContext?: UserContext): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ["branch"],
    });
    if (!employee) {
      throw new NotFoundException(`Empleado con ID "${id}" no encontrado`);
    }

    if (userContext && this.isSecretaria(userContext.role)) {
      if (employee.branch.id !== userContext.branch_id) {
        throw new ForbiddenException('No tienes acceso a este empleado');
      }
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, userId: string, userContext?: UserContext): Promise<Employee> {
    const employee = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      const newBranchId = dto.branch_id || employee.branch.id;
      if (newBranchId !== userContext.branch_id) {
        throw new ForbiddenException('Solo puedes modificar empleados de tu sucursal');
      }
    }

    if (dto.full_name && dto.full_name !== employee.full_name) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { full_name: dto.full_name, deleted_at: IsNull() },
      });
      if (existingEmployee) {
        throw new ConflictException(
          `Ya existe un empleado con el nombre "${dto.full_name}".`,
        );
      }
    }

    if (dto.branch_id && dto.branch_id !== employee.branch.id) {
      const branch = await this.branchRepository.findOne({
        where: { id: dto.branch_id, deleted_at: IsNull() },
      });
      if (!branch) {
        throw new NotFoundException(
          `La sucursal con ID "${dto.branch_id}" no existe o está eliminada.`,
        );
      }
    }

    Object.assign(employee, dto);
    employee.updated_by = userId;
    return this.employeeRepository.save(employee);
  }

  async remove(id: string, userId: string, userContext?: UserContext): Promise<{ id: string; deleted: true }> {
    const employee = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      throw new ForbiddenException('Las secretarias no pueden eliminar empleados');
    }

    const attendanceCount = await this.attendanceRepository.count({
      where: { employee: { id } },
    });
    if (attendanceCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el empleado "${employee.full_name}" porque tiene ${attendanceCount} registro(s) de asistencia. Desactive el empleado en lugar de eliminarlo.`,
      );
    }

    await this.employeeRepository.update({ id }, {
      deleted_at: new Date(),
      deleted_by: userId,
    });
    return { id, deleted: true };
  }

  async toggleActive(id: string, userId: string, userContext?: UserContext): Promise<Employee> {
    const employee = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      if (employee.branch.id !== userContext.branch_id) {
        throw new ForbiddenException('Solo puedes activar/desactivar empleados de tu sucursal');
      }
    }

    employee.active = !employee.active;
    employee.updated_by = userId;
    return this.employeeRepository.save(employee);
  }
}