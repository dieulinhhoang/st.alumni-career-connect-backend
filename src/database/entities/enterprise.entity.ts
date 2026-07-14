import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { EnterpriseFaculty } from './enterprise-faculty.entity';
import { Job } from './job.entity';

@Entity('enterprises')
export class Enterprise {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id !: number;

  @Column({ type: 'varchar', length: 255 })
  name !: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  abbr !: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color !: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry !: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website !: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email !: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone !: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  size !: string;

  @Column({ type: 'text', nullable: true })
  address !: string;

  @Column({ type: 'text', nullable: true })
  description !: string;

  @Column({ type: 'tinyint', default: 0 })
  verified !: number;

  @Column({
    name: 'partner_status',
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  partnerStatus: 'active' | 'inactive';

  // Trạng thái duyệt hồ sơ đối tác.
  // 'approved' mặc định để dữ liệu cũ & DN do admin tạo tay luôn hợp lệ;
  // chỉ hồ sơ tự đăng ký qua API mới ở 'pending'.
  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  // Người liên hệ do DN khai khi đăng ký (không bắt buộc)
  @Column({ name: 'contact_person', type: 'varchar', length: 255, nullable: true })
  contactPerson: string | null;

  @Column({ name: 'joined_date', type: 'varchar', length: 20, nullable: true })
  joinedDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => EnterpriseFaculty, (ef) => ef.enterprise)
  enterpriseFaculties: Relation<EnterpriseFaculty[]>;

  @OneToMany(() => Job, (job) => job.enterprise)
  jobs: Relation<Job[]>;
}
