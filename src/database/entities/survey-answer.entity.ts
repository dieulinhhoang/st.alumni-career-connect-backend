import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SurveyResponse } from './survey-response.entity';
import { SurveyQuestion } from './survey-question.entity';

@Entity('survey_answers')
export class SurveyAnswer {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index('idx_answer_response')
  @Column({ name: 'response_id', type: 'bigint', unsigned: true })
  responseId: number;

  @Index('idx_answer_question')
  @Column({ name: 'question_id', type: 'bigint', unsigned: true })
  questionId: number;

  @Column({ type: 'json', nullable: true })
  answer: string | string[];

  @ManyToOne(() => SurveyResponse, (response) => response.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @ManyToOne(() => SurveyQuestion, (question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;
}
