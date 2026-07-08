import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Supply } from '../supply/entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Customer } from '../customer/entities/customer.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail, Supply, Inventory, Branch, Customer]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
