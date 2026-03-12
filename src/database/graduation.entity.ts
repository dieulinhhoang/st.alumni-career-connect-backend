import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('graduation')
export class Graduation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ nullable: true })
  name: string; // Ví dụ: 'Tốt nghiệp đợt 1 - 2025'

  @Column({ nullable: true })
  certification: string;

  @Column({ type: 'date', nullable: true })
  certification_date: Date;

  @Column({ nullable: true })
  school_year: number;

  @Column({ nullable: true })
  faculty_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}