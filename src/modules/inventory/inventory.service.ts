import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThanOrEqual, Repository } from "typeorm";
import { Inventory } from "./entities/inventory.entity";
import { Branch } from "../branch/entities/branch.entity";
import { Supply } from "../supply/entities/supply.entity";
import { StockTransfer } from "../stock-transfer/entities/stock-transfer.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { FilterInventory } from "./dto/filter-inventory.dto";

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
    @InjectRepository(StockTransfer)
    private readonly stockTransferRepository: Repository<StockTransfer>,
    private readonly configService: ConfigService,
  ) {}

  private getAuditUserId(userId?: string): string {
    if (userId) return userId;
    return (
      this.configService.get<string>("SYSTEM_AUDIT_USER_ID") ??
      "00000000-0000-4000-8000-000000000001"
    );
  }

  async create(dto: CreateInventoryDto, userId?: string): Promise<Inventory> {
    const { branch_id, supply_id } = dto;

    const branch = await this.branchRepository.findOne({
      where: { id: branch_id, deleted_at: IsNull() },
    });
    if (!branch) {
      throw new NotFoundException(
        `La sucursal con ID "${branch_id}" no existe o está eliminada.`,
      );
    }

    const supply = await this.supplyRepository.findOne({
      where: { id: supply_id, deleted_at: IsNull() },
    });
    if (!supply) {
      throw new NotFoundException(
        `El insumo con ID "${supply_id}" no existe o está eliminado.`,
      );
    }

    const existingInventory = await this.inventoryRepository.findOne({
      where: { branch: { id: branch_id }, supply: { id: supply_id } },
    });
    if (existingInventory && !existingInventory.deleted_at) {
      throw new ConflictException(
        `Ya existe un registro de inventario para el insumo "${supply.name}" en la sucursal "${branch.name}". Use el método PUT para actualizar.`,
      );
    }

    const inventory = this.inventoryRepository.create({
      ...dto,
      created_by: this.getAuditUserId(userId),
    });
    return this.inventoryRepository.save(inventory);
  }

  async findAll(
    filters: FilterInventory,
  ): Promise<{ data: Inventory[]; meta: { total: number; limit: number; offset: number } }> {
    const { limit = 10, offset = 0, branch_id, supply_id, low_stock } = filters;

    const where: any = { deleted_at: IsNull() };

    if (branch_id) {
      where.branch = { id: branch_id };
    }
    if (supply_id) {
      where.supply = { id: supply_id };
    }
    if (low_stock === true) {
      where.current_quantity = LessThanOrEqual(0);
    }

    const [data, total] = await this.inventoryRepository.findAndCount({
      where,
      relations: ["branch", "supply"],
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ["branch", "supply"],
    });
    if (!inventory) {
      throw new NotFoundException(`Inventario con ID "${id}" no encontrado`);
    }
    return inventory;
  }

  async update(id: string, dto: UpdateInventoryDto, userId?: string): Promise<Inventory> {
    const inventory = await this.findOne(id);

    if (dto.branch_id && dto.branch_id !== inventory.branch.id) {
      const branch = await this.branchRepository.findOne({
        where: { id: dto.branch_id, deleted_at: IsNull() },
      });
      if (!branch) {
        throw new NotFoundException(
          `La sucursal con ID "${dto.branch_id}" no existe o está eliminada.`,
        );
      }

      if (dto.supply_id) {
        const existingInventory = await this.inventoryRepository.findOne({
          where: {
            branch: { id: dto.branch_id },
            supply: { id: dto.supply_id },
          },
        });
        if (existingInventory && existingInventory.id !== id) {
          throw new ConflictException(
            `Ya existe un registro de inventario para esos parámetros.`,
          );
        }
      }
    }

    if (dto.supply_id && dto.supply_id !== inventory.supply.id) {
      const supply = await this.supplyRepository.findOne({
        where: { id: dto.supply_id, deleted_at: IsNull() },
      });
      if (!supply) {
        throw new NotFoundException(
          `El insumo con ID "${dto.supply_id}" no existe o está eliminado.`,
        );
      }

      if (dto.branch_id) {
        const existingInventory = await this.inventoryRepository.findOne({
          where: {
            branch: { id: dto.branch_id },
            supply: { id: dto.supply_id },
          },
        });
        if (existingInventory && existingInventory.id !== id) {
          throw new ConflictException(
            `Ya existe un registro de inventario para esos parámetros.`,
          );
        }
      }
    }

    Object.assign(inventory, dto);
    inventory.updated_by = this.getAuditUserId(userId);
    return this.inventoryRepository.save(inventory);
  }

  async remove(id: string, userId?: string): Promise<{ id: string; deleted: true }> {
    const inventory = await this.findOne(id);

    const transferCount = await this.stockTransferRepository.count({
      where: [
        { origin_branch: { id: inventory.branch.id }, supply: { id: inventory.supply.id } },
        { destination_branch: { id: inventory.branch.id }, supply: { id: inventory.supply.id } },
      ],
    });
    if (transferCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el inventario porque tiene ${transferCount} traspaso(s) asociado(s).`,
      );
    }

    await this.inventoryRepository.softDelete({ id });
    inventory.deleted_by = this.getAuditUserId(userId);
    await this.inventoryRepository.save(inventory);
    return { id, deleted: true };
  }

  async adjustQuantity(id: string, adjustment: number, userId?: string): Promise<Inventory> {
    const inventory = await this.findOne(id);
    const newQuantity = inventory.current_quantity + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `La cantidad no puede ser negativa. Cantidad actual: ${inventory.current_quantity}, ajuste: ${adjustment}`,
      );
    }

    inventory.current_quantity = newQuantity;
    inventory.updated_by = this.getAuditUserId(userId);
    return this.inventoryRepository.save(inventory);
  }
}