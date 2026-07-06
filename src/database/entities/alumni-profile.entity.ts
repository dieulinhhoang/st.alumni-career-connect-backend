import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('alumni_profiles')
export class AlumniProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  studentCode: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  graduationYear: number;

  @Column({ nullable: true })
  currentPosition: string;

  @Column({ nullable: true })
  currentCompany: string;

  @Column({ nullable: true })
  occupationSector: string;

  @Column({ nullable: true })
  workLocation: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  linkedIn: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
