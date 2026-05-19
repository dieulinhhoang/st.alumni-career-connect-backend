import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Survey } from './survey.entity';
import { Student } from './student.entity';
import { SurveyAnswer } from './survey-answer.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index('idx_response_survey')
  @Column({ name: 'survey_id', type: 'bigint', unsigned: true })
  surveyId: number;

  @Index('idx_response_student')
  @Column({ name: 'student_id', type: 'bigint', unsigned: true, nullable: true })
  studentId: number;

  @Column({ type: 'enum', enum: ['draft', 'submitted'], default: 'draft' })
  status: 'draft' | 'submitted';

  @Column({ name: 'snapshot_info', type: 'json', nullable: true })
  snapshotInfo: Record<string, any>;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: 'submitted_at', type: 'datetime', nullable: true })
  submittedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Survey, (survey) => survey.responses)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => Student, (student) => student.surveyResponses)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => SurveyAnswer, (answer) => answer.response)
  answers: SurveyAnswer[];
}
