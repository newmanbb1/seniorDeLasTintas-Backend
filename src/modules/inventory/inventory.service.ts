import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Supply } from '../supply/entities/supply.entity';
import {
  StockTransfer,
  StockTransferStatus,
} from '../stock-transfer/entities/stock-transfer.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FilterInventory } from './dto/filter-inventory.dto';
import { TransferDto } from './dto/transfer.dto';
import { UserRole } from '../auth/entities/user.entity';

export interface UserContext {
  userId: string;
  role: string;
  branch_id?: string;
}

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
  ) {}

  private getDataSource(): DataSource {
    return this.inventoryRepository.metadata.connection;
  }

  private isSecretaria(role: string): boolean {
    return role === UserRole.SECRETARIA;
  }

  private generateIdempotencyKey(
    originBranchId: string,
    destinationBranchId: string,
    supplyId: string,
    quantity: number,
  ): string {
    const data = `${originBranchId}:${destinationBranchId}:${supplyId}:${quantity}`;
    return createHash('sha256').update(data).digest('hex');
  }

  async create(
    dto: CreateInventoryDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<Inventory> {
    const { branch_id, supply_id } = dto;

    if (userContext && this.isSecretaria(userContext.role)) {
      if (branch_id !== userContext.branch_id) {
        throw new ForbiddenException(
          'Solo puedes crear inventario para tu sucursal',
        );
      }
    }

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
      created_by: userId,
    });
    return this.inventoryRepository.save(inventory);
  }

  async findAll(
    filters: FilterInventory,
    userContext?: UserContext,
  ): Promise<{
    data: Inventory[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const { limit = 10, offset = 0, branch_id, supply_id, low_stock } = filters;

    const where: any = { deleted_at: IsNull() };

    if (userContext && this.isSecretaria(userContext.role)) {
      where.branch = { id: userContext.branch_id };
    } else if (branch_id) {
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
      relations: ['branch', 'supply'],
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string, userContext?: UserContext): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['branch', 'supply'],
    });
    if (!inventory) {
      throw new NotFoundException(`Inventario con ID "${id}" no encontrado`);
    }

    if (userContext && this.isSecretaria(userContext.role)) {
      if (inventory.branch.id !== userContext.branch_id) {
        throw new ForbiddenException('No tienes acceso a este inventario');
      }
    }

    return inventory;
  }

  async update(
    id: string,
    dto: UpdateInventoryDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      const newBranchId = dto.branch_id || inventory.branch.id;
      if (newBranchId !== userContext.branch_id) {
        throw new ForbiddenException(
          'Solo puedes modificar inventario de tu sucursal',
        );
      }
    }

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
    inventory.updated_by = userId;
    return this.inventoryRepository.save(inventory);
  }

  async remove(
    id: string,
    userId: string,
    userContext?: UserContext,
  ): Promise<{ id: string; deleted: true }> {
    const inventory = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      throw new ForbiddenException(
        'Las secretarias no pueden eliminar inventarios',
      );
    }

    const transferCount = await this.stockTransferRepository.count({
      where: [
        {
          origin_branch: { id: inventory.branch.id },
          supply: { id: inventory.supply.id },
        },
        {
          destination_branch: { id: inventory.branch.id },
          supply: { id: inventory.supply.id },
        },
      ],
    });
    if (transferCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el inventario porque tiene ${transferCount} traspaso(s) asociado(s).`,
      );
    }

    await this.inventoryRepository.update(
      { id },
      {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    );
    return { id, deleted: true };
  }

  async adjustQuantity(
    id: string,
    adjustment: number,
    userId: string,
    userContext?: UserContext,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id, userContext);

    if (userContext && this.isSecretaria(userContext.role)) {
      if (inventory.branch.id !== userContext.branch_id) {
        throw new ForbiddenException(
          'Solo puedes ajustar inventario de tu sucursal',
        );
      }
    }

    const newQuantity = inventory.current_quantity + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `La cantidad no puede ser negativa. Cantidad actual: ${inventory.current_quantity}, ajuste: ${adjustment}`,
      );
    }

    inventory.current_quantity = newQuantity;
    inventory.updated_by = userId;
    return this.inventoryRepository.save(inventory);
  }

  async transfer(
    dto: TransferDto,
    userId: string,
    userContext?: UserContext,
  ): Promise<any> {
    if (userContext && this.isSecretaria(userContext.role)) {
      const isInvolved =
        dto.origin_branch_id === userContext.branch_id ||
        dto.destination_branch_id === userContext.branch_id;
      if (!isInvolved) {
        throw new ForbiddenException(
          'Tu transferencia debe involucrar tu sucursal',
        );
      }
    }

    const idempotencyKey = this.generateIdempotencyKey(
      dto.origin_branch_id,
      dto.destination_branch_id,
      dto.supply_id,
      dto.quantity,
    );

    const existingTransfer = await this.stockTransferRepository.findOne({
      where: { idempotency_key: idempotencyKey },
    });
    if (existingTransfer) {
      return {
        transfer_id: existingTransfer.id,
        idempotency_key: idempotencyKey,
        idempotency_replayed: true,
        message: 'Transferencia ya ejecutada previamente',
      };
    }

    const queryRunner = this.getDataSource().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const originBranch = await queryRunner.query(
        'SELECT id, name FROM branch WHERE id = $1 AND deleted_at IS NULL',
        [dto.origin_branch_id],
      );
      if (originBranch.length === 0) {
        throw new NotFoundException(`La sucursal de origen no existe`);
      }

      const destinationBranch = await queryRunner.query(
        'SELECT id, name FROM branch WHERE id = $1 AND deleted_at IS NULL',
        [dto.destination_branch_id],
      );
      if (destinationBranch.length === 0) {
        throw new NotFoundException(`La sucursal de destino no existe`);
      }

      const supply = await queryRunner.query(
        'SELECT id, name FROM supply WHERE id = $1 AND deleted_at IS NULL',
        [dto.supply_id],
      );
      if (supply.length === 0) {
        throw new NotFoundException(`El insumo no existe`);
      }

      const originInventory = await queryRunner.query(
        'SELECT id, current_quantity FROM inventory WHERE branch_id = $1 AND supply_id = $2 AND deleted_at IS NULL',
        [dto.origin_branch_id, dto.supply_id],
      );

      if (originInventory.length === 0) {
        throw new BadRequestException(
          `No existe inventario del insumo "${supply[0].name}" en la sucursal "${originBranch[0].name}"`,
        );
      }

      if (originInventory[0].current_quantity < dto.quantity) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${originInventory[0].current_quantity}, solicitado: ${dto.quantity}`,
        );
      }

      const previousOriginQuantity = originInventory[0].current_quantity;
      await queryRunner.query(
        'UPDATE inventory SET current_quantity = current_quantity - $1, updated_by = $2 WHERE id = $3',
        [dto.quantity, userId, originInventory[0].id],
      );

      const destinationInventory = await queryRunner.query(
        'SELECT id, current_quantity FROM inventory WHERE branch_id = $1 AND supply_id = $2 AND deleted_at IS NULL',
        [dto.destination_branch_id, dto.supply_id],
      );

      let previousDestinationQuantity = 0;
      if (destinationInventory.length > 0) {
        previousDestinationQuantity = destinationInventory[0].current_quantity;
        await queryRunner.query(
          'UPDATE inventory SET current_quantity = current_quantity + $1, updated_by = $2 WHERE id = $3',
          [dto.quantity, userId, destinationInventory[0].id],
        );
      } else {
        await queryRunner.query(
          'INSERT INTO inventory (id, branch_id, supply_id, current_quantity, minimum_stock, created_by, updated_by) VALUES (gen_random_uuid(), $1, $2, $3, 0, $4, $4)',
          [dto.destination_branch_id, dto.supply_id, dto.quantity, userId],
        );
      }

      const transferId = crypto.randomUUID();
      await queryRunner.query(
        'INSERT INTO stock_transfer (id, idempotency_key, origin_branch_id, destination_branch_id, supply_id, quantity, status, request_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)',
        [
          transferId,
          idempotencyKey,
          dto.origin_branch_id,
          dto.destination_branch_id,
          dto.supply_id,
          dto.quantity,
          StockTransferStatus.Received,
          userId,
        ],
      );

      await queryRunner.commitTransaction();

      return {
        transfer_id: transferId,
        idempotency_key: idempotencyKey,
        supply_name: supply[0].name,
        origin_branch: originBranch[0].name,
        destination_branch: destinationBranch[0].name,
        quantity: dto.quantity,
        previous_origin_quantity: previousOriginQuantity,
        new_origin_quantity: previousOriginQuantity - dto.quantity,
        previous_destination_quantity: previousDestinationQuantity,
        new_destination_quantity: previousDestinationQuantity + dto.quantity,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
