import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type FormStatus = 'draft' | 'published';

@Entity('forms')
export class FormEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  sections: object[];

  @Column({ type: 'json', nullable: true })
  questions: object[];

  @Column({ name: 'theme_id', type: 'varchar', length: 100, nullable: true })
  themeId: string;

  @Column({ type: 'json', nullable: true })
  header: object;

  @Column({ type: 'json', nullable: true })
  footer: object;

  @Column({
    type: 'enum',
    enum: ['draft', 'published'],
    default: 'draft',
  })
  status: FormStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
