import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';
import { OrderDetail } from './order-detail.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

export enum OrderStatus {
  Pending = 'Pendiente',
  Confirmed = 'Confirmado',
  Delivered = 'Entregado',
  Cancelled = 'Cancelado',
}

@Entity('order')
export class Order extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'varchar', length: 255 })
  client_name: string;

  @Column({ type: 'varchar', length: 20 })
  client_phone: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  status: OrderStatus;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  @Index()
  branch?: Branch;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  @Index()
  customer?: Customer;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => OrderDetail, (detail) => detail.order, { cascade: true })
  order_details: OrderDetail[];
}
