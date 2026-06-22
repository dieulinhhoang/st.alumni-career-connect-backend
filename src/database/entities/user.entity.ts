import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { SurveyAiGeneration } from './survey-ai-generation.entity';
import { Faculty } from './faculty.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'sso_id', type: 'varchar', length: 255, unique: true })
  sso_id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code!: string;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ type: 'varchar', length: 50, default: 'officer' })
  type!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email!: string | null;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash!: string | null;

  @Index('idx_user_enterprise_id')
  @Column({ name: 'enterprise_id', type: 'bigint', unsigned: true, nullable: true })
  enterpriseId!: number | null;

  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin!: boolean;

  @Index('idx_user_faculty_id')
  @Column({ name: 'faculty_id', type: 'bigint', unsigned: true, nullable: true })
  facultyId!: number | null;

  @ManyToOne(() => Faculty, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'faculty_id' })
  faculty!: Relation<Faculty | null>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles!: Relation<UserRole[]>;

  @OneToMany(() => SurveyAiGeneration, (gen) => gen.user)
  aiGenerations!: Relation<SurveyAiGeneration[]>;
}