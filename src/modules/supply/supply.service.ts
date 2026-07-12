import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { Supply } from './entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { StockTransfer } from '../stock-transfer/entities/stock-transfer.entity';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { FilterSupply } from './dto/filter-supply.dto';
import { FilterPublicSupply } from './dto/filter-public-supply.dto';

export interface PublicSupply {
  id: string;
  code: string;
  name: string;
  category: string;
  unit_of_measure: string;
  images: string[];
  videos: string[];
  sale_price: number;
  brand: string;
  compatibility: string;
  commercial_description: string;
  is_active: boolean;
}

export interface PublicCatalogItem extends PublicSupply {
  stock_by_branch: Array<{
    branch_name: string;
    quantity: number;
  }>;
}

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

  async findAll(filters: FilterSupply): Promise<{
    data: Supply[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const { limit = 10, offset = 0, name, category } = filters;

    const where: any = { deleted_at: IsNull() };

    const sanitizeLike = (v: string) => v.replace(/[%_]/g, '\\$&');
    if (name) {
      where.name = Like(`%${sanitizeLike(name)}%`);
    }
    if (category) {
      where.category = Like(`%${sanitizeLike(category)}%`);
    }

    const [data, total] = await this.supplyRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string): Promise<Supply> {
    const supply = await this.supplyRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!supply) {
      throw new NotFoundException('Insumo no encontrado');
    }
    return supply;
  }

  async findOnePublic(id: string): Promise<PublicSupply> {
    const supply = await this.supplyRepository.findOne({
      where: { id, is_active: true, deleted_at: IsNull() },
    });
    if (!supply) {
      throw new NotFoundException('Producto no encontrado');
    }
    return {
      id: supply.id,
      code: supply.code,
      name: supply.name,
      category: supply.category,
      unit_of_measure: supply.unit_of_measure,
      images: supply.images ?? [],
      videos: supply.videos ?? [],
      sale_price: supply.sale_price,
      brand: supply.brand,
      compatibility: supply.compatibility,
      commercial_description: supply.commercial_description,
      is_active: supply.is_active,
    };
  }

  /** Misma fuente de datos que el catálogo público del cliente (solo activos). */
  async findAllPublicPaginated(filters: FilterPublicSupply): Promise<{
    data: PublicCatalogItem[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const { limit = 10, offset = 0, name, category } = filters;

    const where: Record<string, unknown> = {
      deleted_at: IsNull(),
      is_active: true,
    };

    const sanitizeLike = (v: string) => v.replace(/[%_]/g, '\\$&');
    if (name) {
      where.name = Like(`%${sanitizeLike(name)}%`);
    }
    if (category) {
      where.category = Like(`%${sanitizeLike(category)}%`);
    }

    const [supplies, total] = await this.supplyRepository.findAndCount({
      where,
      relations: ['inventories', 'inventories.branch'],
      take: limit,
      skip: offset,
      order: { category: 'ASC', name: 'ASC' },
    });

    return {
      data: supplies.map((supply) => this.toPublicCatalogItem(supply)),
      meta: { total, limit, offset },
    };
  }

  /** Carga todos los productos activos del catálogo público (para chatbot). */
  async findAllPublicCatalog(): Promise<PublicCatalogItem[]> {
    const pageSize = 100;
    let offset = 0;
    let total = Infinity;
    const all: PublicCatalogItem[] = [];

    while (offset < total) {
      const { data, meta } = await this.findAllPublicPaginated({
        limit: pageSize,
        offset,
      });
      all.push(...data);
      total = meta.total;
      offset += meta.limit;
    }

    return all;
  }

  private toPublicCatalogItem(supply: Supply): PublicCatalogItem {
    const stock_by_branch =
      supply.inventories
        ?.filter((inv) => !inv.deleted_at)
        .map((inv) => ({
          branch_name: inv.branch?.name || 'Sucursal',
          quantity: inv.current_quantity,
        })) ?? [];

    return {
      id: supply.id,
      code: supply.code,
      name: supply.name,
      category: supply.category,
      unit_of_measure: supply.unit_of_measure,
      images: supply.images ?? [],
      videos: supply.videos ?? [],
      sale_price: supply.sale_price,
      brand: supply.brand,
      compatibility: supply.compatibility,
      commercial_description: supply.commercial_description,
      is_active: supply.is_active,
      stock_by_branch,
    };
  }

  async update(
    id: string,
    dto: UpdateSupplyDto,
    userId: string,
  ): Promise<Supply> {
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

    if (dto.code !== undefined) supply.code = dto.code;
    if (dto.name !== undefined) supply.name = dto.name;
    if (dto.category !== undefined) supply.category = dto.category;
    if (dto.unit_of_measure !== undefined) supply.unit_of_measure = dto.unit_of_measure;
    if (dto.is_active !== undefined) supply.is_active = dto.is_active;
    if (dto.umbral_min !== undefined) supply.umbral_min = dto.umbral_min;
    if (dto.images !== undefined) supply.images = dto.images;
    if (dto.videos !== undefined) supply.videos = dto.videos;
    if (dto.sale_price !== undefined) supply.sale_price = dto.sale_price;
    if (dto.brand !== undefined) supply.brand = dto.brand;
    if (dto.compatibility !== undefined) supply.compatibility = dto.compatibility;
    if (dto.commercial_description !== undefined) supply.commercial_description = dto.commercial_description;
    supply.updated_by = userId;
    return this.supplyRepository.save(supply);
  }

  async remove(
    id: string,
    userId: string,
  ): Promise<{ id: string; deleted: true }> {
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

    await this.supplyRepository.update(
      { id },
      {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    );
    return { id, deleted: true };
  }
}
