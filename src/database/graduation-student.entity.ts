import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Graduation } from './graduation.entity';
import { Student } from './student.entity';

@Entity('graduation_student')
export class GraduationStudent {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  graduation_id: string;

  @PrimaryColumn({ type: 'bigint', unsigned: true })
  student_id: string;

  @ManyToOne(() => Graduation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'graduation_id' })
  graduation: Graduation;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;
}