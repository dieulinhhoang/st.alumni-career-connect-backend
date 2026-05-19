import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Survey } from './survey.entity';
import { Graduation } from './graduation.entity';

@Entity('survey_graduation')
export class SurveyGraduation {
  @PrimaryColumn({ name: 'survey_id', type: 'bigint', unsigned: true })
  surveyId: number;

  @PrimaryColumn({ name: 'graduation_id', type: 'bigint', unsigned: true })
  graduationId: number;

  @ManyToOne(() => Survey, (survey) => survey.surveyGraduations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => Graduation, (graduation) => graduation.surveyGraduations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'graduation_id' })
  graduation: Graduation;
}
