import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyAnswer } from './survey-answer.entity'; // Check if this file exists in the current directory

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'enum', enum: ['draft', 'submitted'], default: 'draft' })
  status: string;

  @Column({ type: 'json', nullable: true })
  snapshot_info: any; // Lưu thông tin SV tại thời điểm nộp bài

  @Column({ nullable: true })
  ip_address: string;

  @Column({ type: 'datetime', nullable: true })
  submitted_at: Date;

  @ManyToOne(() => Survey)
  survey: Survey;

  @OneToMany(() => SurveyAnswer, (answer) => answer.response)
  answers: SurveyAnswer[];

  @CreateDateColumn()
  created_at: Date;
}