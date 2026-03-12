import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}