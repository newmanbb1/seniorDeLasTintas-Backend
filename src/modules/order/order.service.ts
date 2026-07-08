import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Supply } from '../supply/entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Customer } from '../customer/entities/customer.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrder } from './dto/filter-order.dto';
import { UserRole } from '../auth/entities/user.entity';

export interface UserContext {
  userId: string;
  role: string;
  branch_id?: string;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  private getDataSource(): DataSource {
    return this.orderRepository.metadata.connection;
  }

  async create(dto: CreateOrderDto, userId: string, userContext?: UserContext): Promise<Order> {
    const supplies = await this.supplyRepository.find({
      where: { deleted_at: IsNull() },
    });
    const supplyMap = new Map(supplies.map((s) => [s.id, s]));

    const details: Partial<OrderDetail>[] = [];
    let total = 0;

    for (const item of dto.items) {
      const supply = supplyMap.get(item.supply_id);
      if (!supply) {
        throw new NotFoundException('Insumo no encontrado');
      }
      const unitPrice = Number(supply.sale_price) || 0;
      const subtotal = unitPrice * item.quantity;
      total += subtotal;
      details.push({
        supply: { id: item.supply_id } as any,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      });
    }

    let clientName = dto.client_name;
    let clientPhone = dto.client_phone;
    let customerRelation: Customer | undefined;

    if (dto.customer_id) {
      const customer = await this.customerRepository.findOne({
        where: { id: dto.customer_id, deleted_at: IsNull() },
      });
      if (customer) {
        clientName = customer.name;
        clientPhone = customer.phone;
        customerRelation = customer;
      }
    }

    const order = this.orderRepository.create({
      client_name: clientName,
      client_phone: clientPhone,
      customer: customerRelation,
      status: OrderStatus.Pending,
      total,
      notes: dto.notes,
      branch: userContext?.branch_id ? { id: userContext.branch_id } as any : undefined,
      created_by: userId,
      order_details: details as OrderDetail[],
    });

    return this.orderRepository.save(order);
  }

  async findAll(filters: FilterOrder, userContext?: UserContext): Promise<{
    data: Order[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const { limit = 10, offset = 0, status, client_name, branch_id } = filters;

    const where: any = { deleted_at: IsNull() };

    if (status) {
      where.status = status;
    }
    if (client_name) {
      where.client_name = client_name;
    }
    if (userContext?.role === UserRole.SECRETARIA) {
      where.branch = { id: userContext.branch_id };
    } else if (branch_id) {
      where.branch = { id: branch_id };
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
      relations: ['order_details', 'order_details.supply', 'branch', 'customer'],
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string, userContext?: UserContext): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['order_details', 'order_details.supply', 'branch', 'customer'],
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (userContext?.role === UserRole.SECRETARIA && order.branch?.id !== userContext.branch_id) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  async update(id: string, dto: UpdateOrderDto, userId: string, userContext?: UserContext): Promise<Order> {
    const order = await this.findOne(id, userContext);

    if (order.status !== OrderStatus.Pending) {
      throw new BadRequestException('Solo se puede editar pedidos en estado Pendiente');
    }

    if (dto.client_name !== undefined) order.client_name = dto.client_name;
    if (dto.client_phone !== undefined) order.client_phone = dto.client_phone;
    if (dto.customer_id !== undefined) {
      const customer = await this.customerRepository.findOne({
        where: { id: dto.customer_id, deleted_at: IsNull() },
      });
      if (customer) {
        order.customer = customer;
        order.client_name = customer.name;
        order.client_phone = customer.phone;
      }
    }
    if (dto.notes !== undefined) order.notes = dto.notes;
    order.updated_by = userId;

    return this.orderRepository.save(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string, userContext?: UserContext): Promise<Order> {
    const order = await this.findOne(id, userContext);
    const newStatus = dto.status;
    const oldStatus = order.status;

    this.validateTransition(oldStatus, newStatus);

    const queryRunner = this.getDataSource().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderToUpdate = await queryRunner.manager.findOne(Order, {
        where: { id },
      });
      if (!orderToUpdate) {
        throw new NotFoundException('Pedido no encontrado');
      }

      orderToUpdate.status = newStatus;
      if (dto.branch_id) {
        orderToUpdate.branch = { id: dto.branch_id } as any;
      }
      orderToUpdate.updated_by = userId;

      await queryRunner.manager.save(orderToUpdate);

      if (newStatus === OrderStatus.Confirmed || newStatus === OrderStatus.Delivered) {
        const branchId = dto.branch_id || order.branch?.id;
        if (!branchId) {
          throw new BadRequestException('Debe asignar una sucursal');
        }
      }

      if (newStatus === OrderStatus.Delivered) {
        const branchId = dto.branch_id || order.branch!.id;

        const details = await queryRunner.manager.find(OrderDetail, {
          where: { order: { id } },
          relations: ['supply'],
        });

        for (const detail of details) {
          const inventory = await queryRunner.manager.findOne(Inventory, {
            where: {
              branch: { id: branchId },
              supply: { id: detail.supply.id },
            },
          });

          if (!inventory || inventory.current_quantity < detail.quantity) {
            throw new BadRequestException(
              `Stock insuficiente de ${detail.supply.name}. Disponible: ${inventory?.current_quantity || 0}, requerido: ${detail.quantity}`,
            );
          }

          inventory.current_quantity -= detail.quantity;
          await queryRunner.manager.save(inventory);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.findOne(id, userContext);
  }

  async remove(id: string, userId: string, userContext?: UserContext): Promise<{ id: string; deleted: true }> {
    const order = await this.findOne(id, userContext);

    if (order.status === OrderStatus.Delivered) {
      throw new BadRequestException('No se puede eliminar un pedido entregado');
    }

    await this.orderRepository.update(
      { id },
      { deleted_at: new Date(), deleted_by: userId },
    );

    return { id, deleted: true };
  }

  private validateTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
      [OrderStatus.Confirmed]: [OrderStatus.Delivered, OrderStatus.Cancelled],
      [OrderStatus.Delivered]: [],
      [OrderStatus.Cancelled]: [],
    };

    if (!allowed[from]?.includes(to)) {
      throw new BadRequestException(
        `No se puede cambiar de ${from} a ${to}`,
      );
    }
  }
}