import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ unique: true })
  sso_id: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  access_token: string;

  @Column({ default: 'active' })
  status: string; // active, inactive...

  @Column({ default: 'officer' })
  type: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}