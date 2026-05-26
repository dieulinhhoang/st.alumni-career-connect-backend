import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlumniBatch } from './alumni-batch.entity';

@Entity('alumni_batch_responses')
export class AlumniBatchResponse {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'batch_id', type: 'bigint' })
  batchId!: number;

  @Column({ name: 'student_id', type: 'varchar', length: 50 })
  studentId!: string;

  @Column({ name: 'student_name', type: 'varchar', length: 255, nullable: true })
  studentName!: string;

  @Column({ name: 'student_email', type: 'varchar', length: 255, nullable: true })
  studentEmail!: string;

  @Column({ name: 'student_phone', type: 'varchar', length: 20, nullable: true })
  studentPhone!: string;

  @Column({ type: 'json', nullable: true })
  answers!: Record<string, any>;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt!: Date;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: 'draft' | 'submitted';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => AlumniBatch, (b) => b.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch!: AlumniBatch;
}
