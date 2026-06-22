import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_sections')
export class SurveySection {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index('idx_section_survey')
  @Column({ name: 'survey_id', type: 'bigint', unsigned: true })
  surveyId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'json', nullable: true })
  condition: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Survey, (survey) => survey.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Relation<Survey>;

  @OneToMany(() => SurveyQuestion, (question) => question.section)
  questions: Relation<SurveyQuestion[]>;
}
