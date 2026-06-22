import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Faculty } from './faculty.entity';
import { Student } from './student.entity';

@Entity('major')
export class Major {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index('idx_major_faculty')
  @Column({ name: 'faculty_id', type: 'bigint', unsigned: true, nullable: true })
  facultyId: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Faculty, (faculty) => faculty.majors, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Relation<Faculty>;

  @OneToMany(() => Student, (student) => student.major)
  students: Relation<Student[]>;
}
