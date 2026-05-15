import { BaseEntity } from "src/common/entities/BaseEntity";
import { Branch } from "src/modules/branch/entities/branch.entity";
import { Supply } from "src/modules/supply/entities/supply.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

@Entity("inventory")
@Unique(["branch", "supply"])
export class Inventory extends BaseEntity {
  @ManyToOne(() => Branch, (branch) => branch.inventories, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "branch_id" })
  @Index()
  branch: Branch;

  @ManyToOne(() => Supply, (supply) => supply.inventories, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "supply_id" })
  @Index()
  supply: Supply;

  @Column({ type: "int", default: 0 })
  current_quantity: number;

  @Column({ type: "int", default: 0 })
  minimum_stock: number;
}
