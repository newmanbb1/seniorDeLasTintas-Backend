import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Attendance } from 'src/modules/attendance/entities/attendance.entity';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity('employee')
export class Employee extends BaseEntity {
  @ManyToOne(() => Branch, (branch) => branch.employees, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'branch_id' })
  @Index()
  branch: Branch;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  access_pin: string;

  @Column({ type: 'varchar', length: 255 })
  position: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  failed_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date | null;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];
}
