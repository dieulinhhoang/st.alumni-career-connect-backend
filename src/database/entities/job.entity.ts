import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Enterprise } from './enterprise.entity';
import { JobFaculty } from './job-faculty.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index('idx_job_enterprise')
  @Column({ name: 'enterprise_id', type: 'bigint', unsigned: true })
  enterpriseId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  salary: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ type: 'enum', enum: ['pending', 'active', 'closed', 'rejected'], default: 'pending' })
  status: 'pending' | 'active' | 'closed' | 'rejected';

  @Column({ name: 'rejection_reason', type: 'varchar', length: 255, nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'posted_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  postedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Enterprise, (enterprise) => enterprise.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Relation<Enterprise>;

  @OneToMany(() => JobFaculty, (jf) => jf.job)
  jobFaculties: Relation<JobFaculty[]>;
}
