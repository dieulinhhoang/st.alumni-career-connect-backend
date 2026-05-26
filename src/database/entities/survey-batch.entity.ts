import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('survey_batches')
export class SurveyBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  formId: number;

  @Column({ default: 'draft' })
  status: string; // draft | active | completed

  @Column({ nullable: true, type: 'date' })
  startDate: string;

  @Column({ nullable: true, type: 'date' })
  endDate: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  graduationPeriod: string;

  @Column({ default: 0 })
  totalStudents: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
