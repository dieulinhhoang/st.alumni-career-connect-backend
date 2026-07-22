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
  type Relation,
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

  @Column({ name: 'citizen_identification_issue_date', type: 'date', nullable: true })
  citizenIdentificationIssueDate: Date;

  @Column({ name: 'citizen_identification_issue_place', type: 'varchar', length: 255, nullable: true })
  citizenIdentificationIssuePlace: string;

  @Index('idx_student_major')
  @Column({ name: 'training_industry_id', type: 'bigint', unsigned: true, nullable: true })
  trainingIndustryId: number;

  @Column({ name: 'school_year_end', type: 'varchar', length: 20, nullable: true })
  schoolYearEnd: string;

  // ─── Các trường bổ sung lấy từ ST Student khi đồng bộ ────────────────────────
  @Column({ name: 'school_year_start', type: 'varchar', length: 20, nullable: true })
  schoolYearStart: string;

  @Column({ name: 'email_edu', type: 'varchar', length: 255, nullable: true })
  emailEdu: string;

  @Column({ name: 'class_name', type: 'varchar', length: 50, nullable: true })
  className: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string;

  @Column({ name: 'training_type', type: 'varchar', length: 50, nullable: true })
  trainingType: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @Column({ name: 'permanent_residence', type: 'varchar', length: 500, nullable: true })
  permanentResidence: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  countryside: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pob: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ethnic: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  religion: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string;

  @Column({ name: 'social_policy_object', type: 'varchar', length: 100, nullable: true })
  socialPolicyObject: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Major, (major) => major.students, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'training_industry_id' })
  major: Relation<Major>;

  @OneToMany(() => GraduationStudent, (gs) => gs.student)
  graduationStudents: Relation<GraduationStudent[]>;

  @OneToMany(() => SurveyResponse, (response) => response.student)
  surveyResponses: Relation<SurveyResponse[]>;
}
