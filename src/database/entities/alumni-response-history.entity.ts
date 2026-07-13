import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AlumniBatchResponse } from './alumni-batch-response.entity';

/** Một mục thay đổi trong answers: sửa câu hỏi nào, từ gì sang gì */
export interface ResponseFieldChange {
  /** id (questionKey) của câu hỏi trong formSnapshot */
  questionId: string;
  /** Tiêu đề câu hỏi tại thời điểm thao tác (để đọc lại không phụ thuộc form gốc) */
  questionTitle: string;
  /** Giá trị trước khi sửa (null nếu là câu hỏi mới có đáp án) */
  before: any;
  /** Giá trị sau khi sửa */
  after: any;
}

/**
 * Lịch sử thao tác trên một phản hồi khảo sát.
 * Lưu đầy đủ: ai thao tác (actor), làm gì (action), sửa cái gì (changes).
 */
@Entity('alumni_response_history')
export class AlumniResponseHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Index('idx_arh_response_id')
  @Column({ name: 'response_id', type: 'bigint', unsigned: true })
  responseId!: number;

  @Index('idx_arh_batch_id')
  @Column({ name: 'batch_id', type: 'bigint', unsigned: true })
  batchId!: number;

  /**
   * submit  = SV tự nộp phiếu lần đầu
   * create  = admin nhập thay SV
   * update  = admin chỉnh sửa phản hồi
   */
  @Column({ type: 'varchar', length: 20 })
  action!: 'submit' | 'create' | 'update';

  /** id người thao tác (user id); null nếu là SV tự nộp qua trang công khai */
  @Column({ name: 'actor_id', type: 'bigint', unsigned: true, nullable: true })
  actorId!: number | null;

  /** Tên người thao tác tại thời điểm thao tác */
  @Column({ name: 'actor_name', type: 'varchar', length: 255, nullable: true })
  actorName!: string | null;

  /** Danh sách các trường bị thay đổi (ResponseFieldChange[]) */
  @Column({ type: 'json', nullable: true })
  changes!: ResponseFieldChange[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => AlumniBatchResponse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response!: Relation<AlumniBatchResponse>;
}
