import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Order } from './order.entity';
import { Supply } from 'src/modules/supply/entities/supply.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('order_detail')
export class OrderDetail extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.order_details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  @Index()
  order: Order;

  @ManyToOne(() => Supply, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supply_id' })
  @Index()
  supply: Supply;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}
