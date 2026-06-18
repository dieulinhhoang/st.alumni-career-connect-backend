import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('alumni_batches')
export class AlumniBatch {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index('idx_alumni_batch_form_id')
  @Column({ name: 'form_id', type: 'bigint', unsigned: true })
  formId: number;

  @Column({ name: 'form_snapshot', type: 'json', nullable: true })
  formSnapshot: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'ended'],
    default: 'draft',
  })
  status: 'draft' | 'active' | 'ended';

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ name: 'graduation_period', type: 'varchar', length: 100, nullable: true })
  graduationPeriod: string;

  /** FK sang bảng graduation — dùng để validate SV tại IdentifyStep */
  @Index('idx_alumni_batch_graduation_id')
  @Column({ name: 'graduation_id', type: 'bigint', unsigned: true, nullable: true })
  graduationId: number;

  @Column({ name: 'total_students', type: 'int', default: 0 })
  totalStudents: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}