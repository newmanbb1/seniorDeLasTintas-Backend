import { BaseEntity } from "src/common/entities/BaseEntity";
import { Inventory } from "src/modules/inventory/entities/inventory.entity";
import { StockTransfer } from "src/modules/stock-transfer/entities/stock-transfer.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity("supply")
export class Supply extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  category: string;

  @Column({ type: "varchar", length: 64 })
  unit_of_measure: string;

  @OneToMany(() => Inventory, (inventory) => inventory.supply)
  inventories: Inventory[];

  @OneToMany(() => StockTransfer, (transfer) => transfer.supply)
  stock_transfers: StockTransfer[];
}
