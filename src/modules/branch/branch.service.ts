import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Like, Repository } from "typeorm";
import { Branch } from "./entities/branch.entity";
import { Employee } from "../employee/entities/employee.entity";
import { Inventory } from "../inventory/entities/inventory.entity";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { FilterBranch } from "./dto/fiter-branch.dto";

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly configService: ConfigService,
  ) {}

  private getAuditUserId(userId?: string): string {
    if (userId) return userId;
    return (
      this.configService.get<string>("SYSTEM_AUDIT_USER_ID") ??
      "00000000-0000-4000-8000-000000000001"
    );
  }

  async create(dto: CreateBranchDto, userId?: string): Promise<Branch> {
    const existname = await this.branchRepository.findOne({
      where: { name:dto.name, deleted_at: IsNull() },
    });
    if (existname) {
      throw new ConflictException(
        `El edificio con el nombre "${dto.name}" ya existe.`,
      );
    }
    const branch = this.branchRepository.create({
      ...dto,
      created_by: this.getAuditUserId(userId),
    });
    return this.branchRepository.save(branch);
  }

  async findAll(filters: FilterBranch): Promise<{ data: Branch[]; meta: { total: number; limit: number; offset: number } }> {
    const { limit = 10, offset = 0, name, address } = filters;

    const where: any = { deleted_at: IsNull() };

    if (name) {
      where.name = Like(`%${name}%`);
    }
    if (address) {
      where.address = Like(`%${address}%`);
    }

    const [data, total] = await this.branchRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with id "${id}" not found`);
    }
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto, userId?: string): Promise<Branch> {
    const branch = await this.findOne(id);

    if (dto.name && dto.name !== branch.name) {
      const existingBranch = await this.branchRepository.findOne({
        where: { name: dto.name, deleted_at: IsNull() },
      });
      if (existingBranch) {
        throw new ConflictException(
          `Ya existe una sucursal con el nombre "${dto.name}"`,
        );
      }
    }

    Object.assign(branch, dto);
    branch.updated_by = this.getAuditUserId(userId);
    return this.branchRepository.save(branch);
  }

  async remove(id: string, userId?: string): Promise<{ id: string; deleted: true }> {
    const branch = await this.findOne(id);

    const employeesCount = await this.employeeRepository.count({
      where: { branch: { id } },
    });
    if (employeesCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la sucursal "${branch.name}" porque tiene ${employeesCount} empleado(s) asociado(s). Desactive los empleados primero.`,
      );
    }

    const inventoryCount = await this.inventoryRepository.count({
      where: { branch: { id } },
    });
    if (inventoryCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la sucursal "${branch.name}" porque tiene ${inventoryCount} registro(s) de inventario. Elimine el inventario primero.`,
      );
    }

    await this.branchRepository.softDelete({ id });
    branch.deleted_by = this.getAuditUserId(userId);
    await this.branchRepository.save(branch);
    return { id, deleted: true };
  }
}
