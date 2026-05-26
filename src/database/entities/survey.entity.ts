import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SurveySection } from './survey-section.entity';
import { SurveyQuestion } from './survey-question.entity';
import { SurveyGraduation } from './survey-graduation.entity';
import { SurveyAiGeneration } from './survey-ai-generation.entity';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'survey_type',
    type: 'enum',
    enum: ['employment', 'contact', 'custom'],
    default: 'employment',
  })
  surveyType: 'employment' | 'contact' | 'custom';

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft',
  })
  status: 'draft' | 'published' | 'closed' | 'archived';

  @Column({ name: 'theme_config', type: 'json', nullable: true })
  themeConfig: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => SurveySection, (section) => section.survey)
  sections: SurveySection[];

  @OneToMany(() => SurveyQuestion, (question) => question.survey)
  questions: SurveyQuestion[];

  @OneToMany(() => SurveyGraduation, (sg) => sg.survey)
  surveyGraduations: SurveyGraduation[];

  @OneToMany(() => SurveyAiGeneration, (gen) => gen.survey)
  aiGenerations: SurveyAiGeneration[];
}