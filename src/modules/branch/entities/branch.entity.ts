import { BaseEntity } from "src/common/entities/BaseEntity";
import { Employee } from "src/modules/employee/entities/employee.entity";
import { Inventory } from "src/modules/inventory/entities/inventory.entity";
import { StockTransfer } from "src/modules/stock-transfer/entities/stock-transfer.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity("branch")
export class Branch extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text" })
  address: string;

  @Column({ type: "text" })
  opening_hours: string;

  @Column({ type: "text" })
  location_link: string;

  @OneToMany(() => Inventory, (inventory) => inventory.branch)
  inventories: Inventory[];

  @OneToMany(() => Employee, (employee) => employee.branch)
  employees: Employee[];

  @OneToMany(() => StockTransfer, (transfer) => transfer.origin_branch)
  outgoing_transfers: StockTransfer[];

  @OneToMany(() => StockTransfer, (transfer) => transfer.destination_branch)
  incoming_transfers: StockTransfer[];
}
