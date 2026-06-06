import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { FilterBranch } from './dto/filter-branch.dto';
import { UserRole } from '../auth/entities/user.entity';

export interface UserContext {
  userId: string;
  role: UserRole;
  branch_id?: string;
}

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async create(dto: CreateBranchDto, userId: string): Promise<Branch> {
    const existname = await this.branchRepository.findOne({
      where: { name: dto.name, deleted_at: IsNull() },
    });
    if (existname) {
      throw new ConflictException(
        `El edificio con el nombre "${dto.name}" ya existe.`,
      );
    }
    const branch = this.branchRepository.create({
      ...dto,
      created_by: userId,
    });
    return this.branchRepository.save(branch);
  }

  async findAll(
    filters: FilterBranch,
    userContext?: UserContext,
  ): Promise<{
    data: Branch[];
    meta: { total: number; limit: number; offset: number };
  }> {
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
      order: { created_at: 'DESC' },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string, _userContext?: UserContext): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with id "${id}" not found`);
    }
    return branch;
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    userId: string,
  ): Promise<Branch> {
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

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.address !== undefined) branch.address = dto.address;
    if (dto.opening_hours !== undefined) branch.opening_hours = dto.opening_hours;
    if (dto.location_link !== undefined) branch.location_link = dto.location_link;
    branch.updated_by = userId;
    return this.branchRepository.save(branch);
  }

  async remove(
    id: string,
    userId: string,
  ): Promise<{ id: string; deleted: true }> {
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

    await this.branchRepository.update(
      { id },
      {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    );
    return { id, deleted: true };
  }
}
