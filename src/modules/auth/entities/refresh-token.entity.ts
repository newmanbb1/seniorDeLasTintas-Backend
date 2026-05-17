import { BaseEntity } from "src/common/entities/BaseEntity";
import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("refresh_token")
export class RefreshToken extends BaseEntity {
  @Index()
  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "text" })
  token: string;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @Column({ type: "boolean", default: false })
  revoked: boolean;
}