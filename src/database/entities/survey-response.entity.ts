import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from './student.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index('idx_response_survey')
  @Column({ name: 'survey_id', type: 'bigint', unsigned: true, nullable: true })
  surveyId: number | null;

  @Index('idx_response_student')
  @Column({ name: 'student_id', type: 'bigint', unsigned: true, nullable: true })
  studentId: number | null;

  @Column({ type: 'enum', enum: ['draft', 'submitted'], default: 'draft' })
  status: 'draft' | 'submitted';

  @Column({ name: 'snapshot_info', type: 'json', nullable: true })
  snapshotInfo: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'submitted_at', type: 'datetime', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.surveyResponses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student | null;
}