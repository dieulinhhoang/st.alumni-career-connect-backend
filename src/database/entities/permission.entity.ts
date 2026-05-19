import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupPermission } from './group-permission.entity';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Index('idx_permission_group')
  @Column({ name: 'group_id', type: 'bigint', unsigned: true, nullable: true })
  groupId: number;

  @ManyToOne(() => GroupPermission, (group) => group.permissions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'group_id' })
  group: GroupPermission;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}
