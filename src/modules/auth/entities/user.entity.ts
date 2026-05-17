import { BaseEntity } from "src/common/entities/BaseEntity";
import { Column, Entity, Index, Unique } from "typeorm";

export enum UserRole {
  ADMIN = 'admin',
}

@Entity("user")
@Unique(['email'])
export class User extends BaseEntity {
  @Index()
  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({ type: "varchar", length: 255 })
  full_name: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Column({ type: "boolean", default: true })
  active: boolean;
}