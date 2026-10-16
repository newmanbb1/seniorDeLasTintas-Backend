import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity('category')
@Unique('UQ_category_name', ['name'])
export class Category extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, default: 'default' })
  icon: string;

  @Column({ type: 'varchar', length: 50, default: 'blue' })
  color: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  display_order: number;
}
