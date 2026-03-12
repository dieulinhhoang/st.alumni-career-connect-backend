import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  //  nối sang User
  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  //  nối sang Role
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn()
  created_at: Date;
}