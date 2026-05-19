import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Major } from './major.entity';
import { GraduationStudent } from './graduation-student.entity';
import { SurveyResponse } from './survey-response.entity';

@Entity('student')
export class Student {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'enum', enum: ['male', 'female', 'other'], nullable: true })
  gender: 'male' | 'female' | 'other';

  @Column({ name: 'citizen_identification', type: 'varchar', length: 20, nullable: true })
  citizenIdentification: string;

  @Index('idx_student_major')
  @Column({ name: 'training_industry_id', type: 'bigint', unsigned: true, nullable: true })
  trainingIndustryId: number;

  @Column({ name: 'school_year_end', type: 'varchar', length: 20, nullable: true })
  schoolYearEnd: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Major, (major) => major.students, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'training_industry_id' })
  major: Major;

  @OneToMany(() => GraduationStudent, (gs) => gs.student)
  graduationStudents: GraduationStudent[];

  @OneToMany(() => SurveyResponse, (response) => response.student)
  surveyResponses: SurveyResponse[];
}
