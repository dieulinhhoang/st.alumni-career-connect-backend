import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Survey } from './survey.entity';
import { SurveySection } from './survey-section.entity';

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

  // FIX Bug 1 & 2: Store the frontend string section ID (e.g. "abc123") separately
  // because section_id FK is bigint and cannot store arbitrary string IDs from frontend
  @Column({ name: 'section_key', type: 'varchar', length: 100, nullable: true })
  sectionKey!: string | null;

  @Column({ name: 'question_text', type: 'text' })
  questionText!: string;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: ['text', 'textarea', 'radio', 'checkbox', 'select', 'date', 'number', 'rating', 'upload', 'address', 'cccd'],
    default: 'text',
  })
  questionType!: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'number' | 'rating' | 'upload' | 'address' | 'cccd';

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

  @Column({ name: 'chart_type', type: 'enum', enum: ['pie', 'column'], nullable: true })
  chartType!: 'pie' | 'column' | null;

  @Column({ name: 'report_template', type: 'varchar', length: 20, nullable: true })
  reportTemplate!: string | null;

  @Column({ name: 'excel_column', type: 'varchar', length: 50, nullable: true })
  excelColumn!: string | null;

  @Column({ type: 'json', nullable: true })
  settings!: Record<string, any> | null;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey!: Relation<Survey>;

  @ManyToOne(() => SurveySection, (section) => section.questions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'section_id' })
  section!: Relation<SurveySection>;

  // Bỏ @OneToMany answers vì SurveyAnswer đã bỏ @ManyToOne để tránh FK constraint
}