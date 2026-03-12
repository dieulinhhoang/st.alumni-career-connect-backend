import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Survey } from './survey.entity';
import { User } from './user.entity';

@Entity('survey_ai_generations')
export class SurveyAiGeneration {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ nullable: true })
  source_file_name: string;

  @Column({ type: 'text', nullable: true })
  prompt_used: string;

  @Column({ type: 'json', nullable: true })
  raw_response: any;

  @Column({ type: 'enum', enum: ['pending', 'success', 'failed'], default: 'pending' })
  status: string;

  @ManyToOne(() => Survey)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;
}