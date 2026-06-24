import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  SECRETARIA = 'secretaria',
}

@Entity('user')
@Unique(['email'])
export class User extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => Branch, (branch) => branch.id, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  @Index()
  branch: Branch;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string;
}
