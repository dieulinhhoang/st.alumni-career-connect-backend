import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  // Bỏ @ManyToOne để tránh TypeORM tạo FK constraint trên DB có data cũ không hợp lệ
  // Join thủ công qua responseId / questionId khi cần query
}