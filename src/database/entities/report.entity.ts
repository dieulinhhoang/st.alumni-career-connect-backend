import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

export enum ReportType {
  EMPLOYMENT = 'employment',
  GRADUATION = 'graduation',
  ENTERPRISE = 'enterprise',
  SURVEY = 'survey',
  GENERAL = 'general',
}

export enum ReportStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: ReportType, default: ReportType.GENERAL })
  type: ReportType;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  status: ReportStatus;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
