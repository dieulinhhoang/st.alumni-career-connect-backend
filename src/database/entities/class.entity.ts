import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { Major } from './major.entity';

@Entity('classes')
export class ClassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  khoa: number;

  @Column({ nullable: true })
  advisor: string;

  @Column({ default: 0 })
  students: number;

  @ManyToOne(() => Major, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'major_id' })
  major: Major;

  @Column({ nullable: true })
  majorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
