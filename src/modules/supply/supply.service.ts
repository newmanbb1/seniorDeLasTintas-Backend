import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Like, Repository } from "typeorm";
import { Supply } from "./entities/supply.entity";
import { Inventory } from "../inventory/entities/inventory.entity";
import { StockTransfer } from "../stock-transfer/entities/stock-transfer.entity";
import { CreateSupplyDto } from "./dto/create-supply.dto";
import { UpdateSupplyDto } from "./dto/update-supply.dto";
import { FilterSupply } from "./dto/filter-supply.dto";

@Injectable()
export class SupplyService {
  constructor(
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(StockTransfer)
    private readonly stockTransferRepository: Repository<StockTransfer>,
  ) {}

  async create(dto: CreateSupplyDto, userId: string): Promise<Supply> {
    const { name } = dto;

    const existingSupply = await this.supplyRepository.findOne({
      where: { name, deleted_at: IsNull() },
    });
    if (existingSupply) {
      throw new ConflictException(
        `Ya existe un insumo con el nombre "${name}".`,
      );
    }

    const supply = this.supplyRepository.create({
      ...dto,
      created_by: userId,
    });
    return this.supplyRepository.save(supply);
  }

  async findAll(
    filters: FilterSupply,
  ): Promise<{ data: Supply[]; meta: { total: number; limit: number; offset: number } }> {
    const { limit = 10, offset = 0, name, category } = filters;

    const where: any = { deleted_at: IsNull() };

    if (name) {
      where.name = Like(`%${name}%`);
    }
    if (category) {
      where.category = Like(`%${category}%`);
    }

    const [data, total] = await this.supplyRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string): Promise<Supply> {
    const supply = await this.supplyRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!supply) {
      throw new NotFoundException(`Insumo con ID "${id}" no encontrado`);
    }
    return supply;
  }

  async update(id: string, dto: UpdateSupplyDto, userId: string): Promise<Supply> {
    const supply = await this.findOne(id);

    if (dto.name && dto.name !== supply.name) {
      const existingSupply = await this.supplyRepository.findOne({
        where: { name: dto.name, deleted_at: IsNull() },
      });
      if (existingSupply) {
        throw new ConflictException(
          `Ya existe un insumo con el nombre "${dto.name}".`,
        );
      }
    }

    Object.assign(supply, dto);
    supply.updated_by = userId;
    return this.supplyRepository.save(supply);
  }

  async remove(id: string, userId: string): Promise<{ id: string; deleted: true }> {
    const supply = await this.findOne(id);

    const inventoryCount = await this.inventoryRepository.count({
      where: { supply: { id } },
    });
    if (inventoryCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el insumo "${supply.name}" porque tiene ${inventoryCount} registro(s) de inventario. Elimine el inventario primero.`,
      );
    }

    const transferCount = await this.stockTransferRepository.count({
      where: { supply: { id } },
    });
    if (transferCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el insumo "${supply.name}" porque tiene ${transferCount} traspaso(s) asociado(s). Elimine los traspasos primero.`,
      );
    }

    await this.supplyRepository.update({ id }, {
      deleted_at: new Date(),
      deleted_by: userId,
    });
    return { id, deleted: true };
  }
}