import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_sections')
export class SurveySection {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  order_index: number;

  @Column({ type: 'json', nullable: true })
  condition: any;

  @ManyToOne(() => Survey, (survey) => survey.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @OneToMany(() => SurveyQuestion, (question) => question.section)
  questions: SurveyQuestion[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}