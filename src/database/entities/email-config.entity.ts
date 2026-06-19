import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('email_configs')
export class EmailConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'smtp' })
  mailer: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  host: string;

  @Column({ type: 'int', default: 587 })
  port: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  account: string;

  @Column({ type: 'text', nullable: true })
  password: string | null;

  @Column({ name: 'sender_name', type: 'varchar', length: 255, default: '' })
  senderName: string;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
