import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Role } from './role.entity';
import { Resource } from './resources.entity';

@Entity('role_resources')
export class RoleResource {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId: number;

  @Column({ name: 'resource_id', type: 'bigint', unsigned: true })
  resourceId: number;

  @Column('simple-array')
  actions: string[];

  @ManyToOne(() => Role, (role) => role.roleResources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Relation<Role>;

  @ManyToOne(() => Resource, (resource) => resource.roleResources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: Relation<Resource>;
}