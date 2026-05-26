import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlumniBatch } from './alumni-batch.entity';

@Entity('alumni_responses')
export class AlumniResponse {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'batch_id', type: 'bigint', unsigned: true })
  batchId: number;

  @Column({ name: 'student_id', type: 'varchar', length: 50, nullable: true })
  studentId: string;

  @Column({ name: 'student_name', type: 'varchar', length: 255, nullable: true })
  studentName: string;

  @Column({ name: 'student_email', type: 'varchar', length: 255, nullable: true })
  studentEmail: string;

  @Column({ name: 'student_phone', type: 'varchar', length: 50, nullable: true })
  studentPhone: string;

  @Column({ type: 'json', nullable: true })
  answers: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['draft', 'submitted'],
    default: 'draft',
  })
  status: 'draft' | 'submitted';

  @Column({ name: 'submitted_at', type: 'datetime', nullable: true })
  submittedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => AlumniBatch, (b) => b.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: AlumniBatch;
}
