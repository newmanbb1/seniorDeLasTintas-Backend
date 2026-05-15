import { BaseEntity } from "src/common/entities/BaseEntity";
import { Branch } from "src/modules/branch/entities/branch.entity";
import { Supply } from "src/modules/supply/entities/supply.entity";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";

export enum StockTransferStatus {
  InTransit = "in_transit",
  Received = "received",
  Rejected = "rejected",
}

@Entity("stock_transfer")
export class StockTransfer extends BaseEntity {
  @ManyToOne(() => Branch, (branch) => branch.outgoing_transfers, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "origin_branch_id" })
  @Index()
  origin_branch: Branch;

  @ManyToOne(() => Branch, (branch) => branch.incoming_transfers, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "destination_branch_id" })
  @Index()
  destination_branch: Branch;

  @ManyToOne(() => Supply, (supply) => supply.stock_transfers, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "supply_id" })
  @Index()
  supply: Supply;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "timestamp" })
  request_date: Date;

  @Column({ type: "timestamp", nullable: true })
  reception_date: Date | null;

  @Column({
    type: "enum",
    enum: StockTransferStatus,
    default: StockTransferStatus.InTransit,
  })
  status: StockTransferStatus;
}
