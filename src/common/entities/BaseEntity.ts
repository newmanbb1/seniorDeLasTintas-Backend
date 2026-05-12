import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Exclude()
    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
    
    @Exclude()
    @Index()
    @Column('uuid')
    created_by: string;

    @Exclude()
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @Exclude()
    @Index()
    @Column('uuid', { nullable: true })
    updated_by?: string;

    @Exclude()
    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deleted_at?: Date;

    @Exclude()
    @Index()
    @Column('uuid', { nullable: true })
    deleted_by?: string;
}