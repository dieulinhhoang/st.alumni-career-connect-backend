import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity('group_permissions')
export class GroupPermission {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  order_index: number;

  @OneToMany(() => Permission, (permission) => permission.group_relation)
  permissions: Permission[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}