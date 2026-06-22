import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Graduation } from './graduation.entity';
import { Student } from './student.entity';

@Entity('graduation_student')
export class GraduationStudent {
  @PrimaryColumn({ name: 'graduation_id', type: 'bigint', unsigned: true })
  graduationId: number;

  @PrimaryColumn({ name: 'student_id', type: 'bigint', unsigned: true })
  studentId: number;

  @ManyToOne(() => Graduation, (graduation) => graduation.graduationStudents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'graduation_id' })
  graduation: Relation<Graduation>;

  @ManyToOne(() => Student, (student) => student.graduationStudents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<Student>;
}
