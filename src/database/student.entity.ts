import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Major } from './major.entity';

@Entity('student')
export class Student {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ unique: true })
  code: string; // Mã sinh viên

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  phone: string;

  @ManyToOne(() => Major)
  @JoinColumn({ name: 'training_industry_id' })
  major: Major;

  @CreateDateColumn()
  created_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}