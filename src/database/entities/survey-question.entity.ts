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
  id: number;

  @Index('idx_question_survey')
  @Column({ name: 'survey_id', type: 'bigint', unsigned: true })
  surveyId: number;

  @Index('idx_question_section')
  @Column({ name: 'section_id', type: 'bigint', unsigned: true, nullable: true })
  sectionId: number;

  @Column({ name: 'question_key', type: 'varchar', length: 100 })
  questionKey: string;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: ['text', 'textarea', 'radio', 'checkbox', 'select', 'date', 'number', 'rating', 'upload'],
    default: 'text',
  })
  questionType: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'number' | 'rating' | 'upload';

  @Column({ type: 'json', nullable: true })
  options: { id: string; label: string }[];

  @Column({ name: 'is_required', type: 'tinyint', default: 0 })
  isRequired: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Column({ name: 'visible_when', type: 'json', nullable: true })
  visibleWhen: Record<string, any>;

  @Column({ name: 'report_field_key', type: 'varchar', length: 100, nullable: true })
  reportFieldKey: string;

  @Column({ name: 'show_in_chart', type: 'tinyint', nullable: true, default: 0 })
  showInChart: number;

  @Column({
    name: 'chart_type',
    type: 'enum',
    enum: ['pie', 'column'],
    nullable: true,
  })
  chartType: 'pie' | 'column';

  @Column({ name: 'report_template', type: 'varchar', length: 20, nullable: true })
  reportTemplate: string;

  @Column({ name: 'excel_column', type: 'varchar', length: 50, nullable: true })
  excelColumn: string;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => SurveySection, (section) => section.questions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'section_id' })
  section: SurveySection;

  @OneToMany(() => SurveyAnswer, (answer) => answer.question)
  answers: SurveyAnswer[];
}
