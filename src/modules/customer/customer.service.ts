import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Order } from '../order/entities/order.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomer } from './dto/filter-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(dto: CreateCustomerDto, userId: string): Promise<Customer> {
    const existingPhone = await this.customerRepository.findOne({
      where: { phone: dto.phone, deleted_at: IsNull() },
    });
    if (existingPhone) {
      throw new ConflictException(
        `Ya existe un cliente con el teléfono "${dto.phone}".`,
      );
    }

    if (dto.nit) {
      const existingNit = await this.customerRepository.findOne({
        where: { nit: dto.nit, deleted_at: IsNull() },
      });
      if (existingNit) {
        throw new ConflictException(
          `Ya existe un cliente con el NIT "${dto.nit}".`,
        );
      }
    }

    const customer = this.customerRepository.create({
      ...dto,
      created_by: userId,
    });
    return this.customerRepository.save(customer);
  }

  async findAll(filters: FilterCustomer): Promise<{
    data: Customer[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const { limit = 10, offset = 0, name, phone, nit } = filters;
    const where: any = { deleted_at: IsNull() };

    if (name) {
      where.name = Like(`%${name}%`);
    }
    if (phone) {
      where.phone = Like(`%${phone}%`);
    }
    if (nit) {
      where.nit = Like(`%${nit}%`);
    }

    const [data, total] = await this.customerRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return { data, meta: { total, limit, offset } };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!customer) {
      throw new NotFoundException(`Cliente con ID "${id}" no encontrado`);
    }
    return customer;
  }

  async findOrders(id: string): Promise<Order[]> {
    const customer = await this.findOne(id);
    return this.orderRepository.find({
      where: { customer: { id: customer.id }, deleted_at: IsNull() },
      relations: ['order_details', 'order_details.supply', 'branch'],
      order: { created_at: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateCustomerDto, userId: string): Promise<Customer> {
    const customer = await this.findOne(id);

    if (dto.phone && dto.phone !== customer.phone) {
      const existingPhone = await this.customerRepository.findOne({
        where: { phone: dto.phone, deleted_at: IsNull() },
      });
      if (existingPhone) {
        throw new ConflictException(
          `Ya existe un cliente con el teléfono "${dto.phone}".`,
        );
      }
    }

    if (dto.nit && dto.nit !== customer.nit) {
      const existingNit = await this.customerRepository.findOne({
        where: { nit: dto.nit, deleted_at: IsNull() },
      });
      if (existingNit) {
        throw new ConflictException(
          `Ya existe un cliente con el NIT "${dto.nit}".`,
        );
      }
    }

    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.nit !== undefined) customer.nit = dto.nit;
    customer.updated_by = userId;

    return this.customerRepository.save(customer);
  }

  async remove(id: string, userId: string): Promise<{ id: string; deleted: true }> {
    const customer = await this.findOne(id);
    await this.customerRepository.update(
      { id },
      { deleted_at: new Date(), deleted_by: userId },
    );
    return { id, deleted: true };
  }
}
