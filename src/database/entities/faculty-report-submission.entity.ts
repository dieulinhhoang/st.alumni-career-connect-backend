import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type FacultyReportStatus = 'draft' | 'submitted' | 'returned' | 'approved';

/**
 * Bảng lưu trạng thái nộp báo cáo của từng khoa theo từng đợt khảo sát.
 * Unique key: (batch_id, faculty_id) — mỗi khoa chỉ có 1 bản ghi / đợt.
 */
@Entity('faculty_report_submissions')
@Index('idx_frs_batch_faculty', ['batchId', 'facultyId'], { unique: true })
export class FacultyReportSubmission {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'batch_id', type: 'bigint', unsigned: true })
  batchId: number;

  @Column({ name: 'faculty_id', type: 'bigint', unsigned: true })
  facultyId: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'submitted', 'returned', 'approved'],
    default: 'draft',
  })
  status: FacultyReportStatus;

  /** ID user của khoa đã nộp (lấy từ JWT) */
  @Column({ name: 'submitted_by', type: 'varchar', length: 255, nullable: true })
  submittedBy: string | null;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  /** Nhận xét của trường khi trả lại */
  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  /** ID user trường đã duyệt */
  @Column({ name: 'reviewed_by', type: 'varchar', length: 255, nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}