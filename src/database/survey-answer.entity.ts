import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SurveyResponse } from "./survey-response.entity";

@Entity('survey_answers')
export class SurveyAnswer {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column()
  question_key: string;

  @Column({ type: 'text', nullable: true })
  answer_value: string; // Cho câu hỏi text/radio

  @Column({ type: 'json', nullable: true })
  answer_values: any; // Cho câu hỏi checkbox/multi-select

  @ManyToOne(() => SurveyResponse, (res) => res.answers, { onDelete: 'CASCADE' })
  response: SurveyResponse;
}