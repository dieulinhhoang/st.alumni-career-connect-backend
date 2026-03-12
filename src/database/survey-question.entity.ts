import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Survey } from './survey.entity';
import { SurveySection } from './survey-section.entity';

@Entity('survey_questions')
export class SurveyQuestion {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ length: 100 })
  question_key: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({
    type: 'enum',
    enum: ['text', 'textarea', 'radio', 'checkbox', 'select', 'date', 'number', 'rating', 'upload'],
    default: 'text'
  })
  question_type: string;

  @Column({ type: 'json', nullable: true })
  options: any;

  @Column({ type: 'tinyint', default: 0 })
  is_required: boolean;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => SurveySection, (section) => section.questions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'section_id' })
  section: SurveySection;

}