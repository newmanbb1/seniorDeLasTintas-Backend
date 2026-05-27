import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Inventory } from 'src/modules/inventory/entities/inventory.entity';
import { StockTransfer } from 'src/modules/stock-transfer/entities/stock-transfer.entity';
import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';

@Entity('supply')
@Unique('UQ_supply_code', ['code'])
export class Supply extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  category: string;

  @Column({ type: 'varchar', length: 64 })
  unit_of_measure: string;

  @Column({ type: 'text', array: true, nullable: true })
  images: string[];

  @Column({ type: 'text', array: true, nullable: true })
  videos: string[];

  @OneToMany(() => Inventory, (inventory) => inventory.supply)
  inventories: Inventory[];

  @OneToMany(() => StockTransfer, (transfer) => transfer.supply)
  stock_transfers: StockTransfer[];
}
