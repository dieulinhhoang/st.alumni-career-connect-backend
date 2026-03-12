import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Survey } from './survey.entity';
import { Graduation } from './graduation.entity';

@Entity('survey_graduation')
export class SurveyGraduation {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  survey_id: string;

  @PrimaryColumn({ type: 'bigint', unsigned: true })
  graduation_id: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => Graduation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'graduation_id' })
  graduation: Graduation;
}