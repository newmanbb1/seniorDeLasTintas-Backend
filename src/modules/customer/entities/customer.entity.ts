import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Order } from 'src/modules/order/entities/order.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity('customer')
export class Customer extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  nit?: string;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
