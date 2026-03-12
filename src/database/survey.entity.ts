import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { SurveyQuestion } from './survey-question.entity';
import { SurveySection } from './survey-section.entity';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['employment', 'contact', 'custom'], default: 'employment' })
  survey_type: string;

  @Column({ type: 'enum', enum: ['draft', 'published', 'closed', 'archived'], default: 'draft' })
  status: string;

  @Column({ type: 'json', nullable: true })
  theme_config: any;

  @Column({ type: 'json', nullable: true })
  settings: any;

  @OneToMany(() => SurveyQuestion, (question) => question.survey)
  questions: SurveyQuestion[];

  @OneToMany(() => SurveySection, (section) => section.survey)
  sections: SurveySection[];
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}