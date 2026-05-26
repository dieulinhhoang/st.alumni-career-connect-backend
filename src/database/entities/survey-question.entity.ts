import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Survey } from './survey.entity';
import { SurveySection } from './survey-section.entity';
import { SurveyAnswer } from './survey-answer.entity';

@Entity('survey_questions')
export class SurveyQuestion {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Index('idx_question_survey')
  @Column({ name: 'survey_id', type: 'bigint', unsigned: true, nullable: true })
  surveyId: number | null;

  @Index('idx_question_section')
  @Column({ name: 'section_id', type: 'bigint', unsigned: true, nullable: true })
  sectionId!: number | null;

  @Column({ name: 'question_key', type: 'varchar', length: 100 })
  questionKey!: string;

  @Column({ name: 'question_text', type: 'text' })
  questionText!: string;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: ['text', 'textarea', 'radio', 'checkbox', 'select', 'date', 'number', 'rating', 'upload'],
    default: 'text',
  })
  questionType!: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'number' | 'rating' | 'upload';

  @Column({ type: 'json', nullable: true })
  options!: { id: string; label: string }[] | null;

  @Column({ name: 'is_required', type: 'tinyint', default: 0 })
  isRequired!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ name: 'visible_when', type: 'json', nullable: true })
  visibleWhen!: Record<string, any> | null;

  @Column({ name: 'report_field_key', type: 'varchar', length: 100, nullable: true })
  reportFieldKey!: string | null;

  @Column({ name: 'show_in_chart', type: 'tinyint', nullable: true, default: 0 })
  showInChart!: number | null;

  @Column({
    name: 'chart_type',
    type: 'enum',
    enum: ['pie', 'column'],
    nullable: true,
  })
  chartType!: 'pie' | 'column' | null;

  @Column({ name: 'report_template', type: 'varchar', length: 20, nullable: true })
  reportTemplate!: string | null;

  @Column({ name: 'excel_column', type: 'varchar', length: 50, nullable: true })
  excelColumn!: string | null;

  @Column({ type: 'json', nullable: true })
  settings!: Record<string, any> | null;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey!: Survey;

  @ManyToOne(() => SurveySection, (section) => section.questions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'section_id' })
  section!: SurveySection;

  @OneToMany(() => SurveyAnswer, (answer) => answer.question)
  answers!: SurveyAnswer[];
}
