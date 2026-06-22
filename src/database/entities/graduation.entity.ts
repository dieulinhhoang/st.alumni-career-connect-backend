import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Faculty } from './faculty.entity';
import { GraduationStudent } from './graduation-student.entity';
import { SurveyGraduation } from './survey-graduation.entity';

@Entity('graduation')
export class Graduation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certification: string;

  @Column({ name: 'certification_date', type: 'date', nullable: true })
  certificationDate: Date;

  @Column({ name: 'school_year', type: 'int', nullable: true })
  schoolYear: number;

  // ✅ Thêm @Column để TypeORM expose facultyId mà không cần load relation
  @Column({ name: 'faculty_id', type: 'bigint', unsigned: true, nullable: true })
  facultyId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Faculty, (faculty) => faculty.graduations, { nullable: true })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Relation<Faculty>;

  @OneToMany(() => GraduationStudent, (gs) => gs.graduation)
  graduationStudents: Relation<GraduationStudent[]>;

  @OneToMany(() => SurveyGraduation, (sg) => sg.graduation)
  surveyGraduations: Relation<SurveyGraduation[]>;
}
