import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Major } from './major.entity';
import { Graduation } from './graduation.entity';
import { EnterpriseFaculty } from './enterprise-faculty.entity';
import { JobFaculty } from './job-faculty.entity';
import { Role } from './role.entity';

@Entity('faculty')
export class Faculty {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  abbr: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => Major, (major) => major.faculty)
  majors: Major[];

  @OneToMany(() => Graduation, (graduation) => graduation.faculty)
  graduations: Graduation[];

  @OneToMany(() => EnterpriseFaculty, (ef) => ef.faculty)
  enterpriseFaculties: EnterpriseFaculty[];

  @OneToMany(() => JobFaculty, (jf) => jf.faculty)
  jobFaculties: JobFaculty[];

  @OneToMany(() => Role, (role) => role.faculty)
  roles: Role[];
}
