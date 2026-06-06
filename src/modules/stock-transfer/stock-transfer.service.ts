import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { IsNull, Like, Repository } from 'typeorm';
import {
  StockTransfer,
  StockTransferStatus,
} from './entities/stock-transfer.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Supply } from '../supply/entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';
import { FilterStockTransfer } from './dto/filter-stock-transfer.dto';
import { UserRole } from '../auth/entities/user.entity';

export interface UserContext {
  userId: string;
  role: string;
  branch_id?: string;
}

@Injectable()
export class StockTransferService {
  constructor(
    @InjectRepository(StockTransfer)
    private readonly stockTransferRepository: Repository<StockTransfer>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  private isSecretaria(role: string): boolean {
    return role === UserRole.SECRETARIA;
  }

  async create(
    dto: CreateStockTransferDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<StockTransfer> {
    const { origin_branch_id, destination_branch_id, supply_id, quantity } =
      dto;

    if (userContext && this.isSecretaria(userContext.role)) {
      const isInvolved =
        origin_branch_id === userContext.branch_id ||
        destination_branch_id === userContext.branch_id;
      if (!isInvolved) {
        throw new ForbiddenException(
          'Tu transferencia debe involucrar tu sucursal',
        );
      }
    }

    if (origin_branch_id === destination_branch_id) {
      throw new BadRequestException(
        'La sucursal de origen y destino no pueden ser iguales.',
      );
    }

    const originBranch = await this.branchRepository.findOne({
      where: { id: origin_branch_id, deleted_at: IsNull() },
    });
    if (!originBranch) {
      throw new NotFoundException(
        `La sucursal de origen con ID "${origin_branch_id}" no existe o está eliminada.`,
      );
    }

    const destinationBranch = await this.branchRepository.findOne({
      where: { id: destination_branch_id, deleted_at: IsNull() },
    });
    if (!destinationBranch) {
      throw new NotFoundException(
        `La sucursal de destino con ID "${destination_branch_id}" no existe o está eliminada.`,
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

    const originInventory = await this.inventoryRepository.findOne({
      where: { branch: { id: origin_branch_id }, supply: { id: supply_id } },
    });
    if (!originInventory) {
      throw new BadRequestException(
        `No existe inventario del insumo "${supply.name}" en la sucursal "${originBranch.name}".`,
      );
    }

    if (originInventory.current_quantity < quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Cantidad disponible: ${originInventory.current_quantity}, solicitada: ${quantity}.`,
      );
    }

    const stockTransfer = this.stockTransferRepository.create({
      origin_branch: { id: dto.origin_branch_id } as Branch,
      destination_branch: { id: dto.destination_branch_id } as Branch,
      supply: { id: dto.supply_id } as Supply,
      quantity: dto.quantity,
      request_date: dto.request_date ?? new Date(),
      status: StockTransferStatus.InTransit,
      created_by: userId,
    });
    return this.stockTransferRepository.save(stockTransfer);
  }

  async findAll(
    filters: FilterStockTransfer,
    userContext?: UserContext,
  ): Promise<{
    data: StockTransfer[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const {
      limit = 10,
      offset = 0,
      origin_branch_id,
      destination_branch_id,
      supply_id,
      status,
    } = filters;

    let where: any = {};

    if (
      userContext &&
      this.isSecretaria(userContext.role) &&
      userContext.branch_id
    ) {
      where = [
        { origin_branch: { id: userContext.branch_id }, deleted_at: IsNull() },
        { destination_branch: { id: userContext.branch_id }, deleted_at: IsNull() },
      ];
    } else {
      where = { deleted_at: IsNull() };
      if (origin_branch_id) {
        where.origin_branch = { id: origin_branch_id };
      }
      if (destination_branch_id) {
        where.destination_branch = { id: destination_branch_id };
      }
    }
    if (supply_id) {
      if (Array.isArray(where)) {
        where = where.map(w => ({ ...w, supply: { id: supply_id } }));
      } else {
        where.supply = { id: supply_id };
      }
    }
    if (status) {
      if (Array.isArray(where)) {
        where = where.map(w => ({ ...w, status }));
      } else {
        where.status = status;
      }
    }

    const [data, total] = await this.stockTransferRepository.findAndCount({
      where,
      relations: ['origin_branch', 'destination_branch', 'supply'],
      take: limit,
      skip: offset,
      order: { request_date: 'DESC' },
    });

    const plainData = data.map(entity => instanceToPlain(entity));

    return { data: plainData as StockTransfer[], meta: { total, limit, offset } };
  }

  async findOne(id: string, userContext?: UserContext): Promise<StockTransfer> {
    const stockTransfer = await this.stockTransferRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['origin_branch', 'destination_branch', 'supply'],
    });
    if (!stockTransfer) {
      throw new NotFoundException(`Traspaso con ID "${id}" no encontrado`);
    }

    if (
      userContext &&
      this.isSecretaria(userContext.role) &&
      userContext.branch_id
    ) {
      const isInvolved =
        stockTransfer.origin_branch.id === userContext.branch_id ||
        stockTransfer.destination_branch.id === userContext.branch_id;
      if (!isInvolved) {
        throw new ForbiddenException('No tienes acceso a este traspaso');
      }
    }

    return stockTransfer;
  }

  async update(
    id: string,
    dto: UpdateStockTransferDto,
    userId: string,
  ): Promise<StockTransfer> {
    const stockTransfer = await this.findOne(id);

    if (stockTransfer.status !== StockTransferStatus.InTransit) {
      throw new BadRequestException(
        `No se puede modificar un traspaso que ya está "${stockTransfer.status}".`,
      );
    }

    Object.assign(stockTransfer, dto);
    stockTransfer.updated_by = userId;
    return this.stockTransferRepository.save(stockTransfer);
  }

  async receive(id: string, userId: string): Promise<StockTransfer> {
    const stockTransfer = await this.findOne(id);

    if (stockTransfer.status !== StockTransferStatus.InTransit) {
      throw new BadRequestException(
        `El traspaso no puede ser recibido. Estado actual: "${stockTransfer.status}".`,
      );
    }

    const destinationInventory = await this.inventoryRepository.findOne({
      where: {
        branch: { id: stockTransfer.destination_branch.id },
        supply: { id: stockTransfer.supply.id },
      },
    });

    if (destinationInventory) {
      destinationInventory.current_quantity += stockTransfer.quantity;
      destinationInventory.updated_by = userId;
      await this.inventoryRepository.save(destinationInventory);
    } else {
      const newInventory = this.inventoryRepository.create({
        branch: stockTransfer.destination_branch,
        supply: stockTransfer.supply,
        current_quantity: stockTransfer.quantity,
        minimum_stock: 0,
        created_by: userId,
      });
      await this.inventoryRepository.save(newInventory);
    }

    const originInventory = await this.inventoryRepository.findOne({
      where: {
        branch: { id: stockTransfer.origin_branch.id },
        supply: { id: stockTransfer.supply.id },
      },
    });
    if (originInventory) {
      originInventory.current_quantity -= stockTransfer.quantity;
      originInventory.updated_by = userId;
      await this.inventoryRepository.save(originInventory);
    }

    stockTransfer.status = StockTransferStatus.Received;
    stockTransfer.reception_date = new Date();
    stockTransfer.updated_by = userId;
    return this.stockTransferRepository.save(stockTransfer);
  }

  async reject(id: string, userId: string): Promise<StockTransfer> {
    const stockTransfer = await this.findOne(id);

    if (stockTransfer.status !== StockTransferStatus.InTransit) {
      throw new BadRequestException(
        `El traspaso no puede ser rechazado. Estado actual: "${stockTransfer.status}".`,
      );
    }

    stockTransfer.status = StockTransferStatus.Rejected;
    stockTransfer.updated_by = userId;
    return this.stockTransferRepository.save(stockTransfer);
  }

  async remove(
    id: string,
    userId: string,
  ): Promise<{ id: string; deleted: true }> {
    const stockTransfer = await this.findOne(id);

    if (stockTransfer.status === StockTransferStatus.InTransit) {
      throw new ConflictException(
        "No se puede eliminar un traspaso en estado 'En Tránsito'. Rechace o reciba el traspaso primero.",
      );
    }

    await this.stockTransferRepository.update(
      { id },
      {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    );
    return { id, deleted: true };
  }
}
