import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Employee } from 'src/modules/employee/entities/employee.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export enum AttendanceEntryStatus {
  Punctual = 'punctual',
  Late = 'late',
  Absence = 'absence',
}

@Entity('attendance')
export class Attendance extends BaseEntity {
  @ManyToOne(() => Employee, (employee) => employee.attendances, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'employee_id' })
  @Index()
  employee: Employee;

  @Column({ type: 'date' })
  register_date: string;

  @Column({ type: 'timestamp' })
  check_in: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out: Date | null;

  @Column({
    type: 'enum',
    enum: AttendanceEntryStatus,
  })
  check_in_status: AttendanceEntryStatus;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  hours_worked: string;
}
