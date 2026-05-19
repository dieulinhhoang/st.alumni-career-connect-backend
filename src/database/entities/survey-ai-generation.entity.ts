import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Survey } from './survey.entity';
import { User } from './user.entity';

@Entity('survey_ai_generations')
export class SurveyAiGeneration {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index('idx_ai_gen_survey')
  @Column({ name: 'survey_id', type: 'bigint', unsigned: true, nullable: true })
  surveyId: number;

  @Index('idx_ai_gen_user')
  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  userId: number;

  @Column({ name: 'source_file_name', type: 'varchar', length: 255, nullable: true })
  sourceFileName: string;

  @Column({ name: 'prompt_used', type: 'text', nullable: true })
  promptUsed: string;

  @Column({ name: 'raw_response', type: 'json', nullable: true })
  rawResponse: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'success' | 'failed';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Survey, (survey) => survey.aiGenerations)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => User, (user) => user.aiGenerations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
