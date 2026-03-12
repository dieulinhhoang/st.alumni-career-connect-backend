import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GroupPermission } from './group-permission.entity'; // Nhớ import

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

   @ManyToOne(() => GroupPermission, (group) => group.permissions)
  @JoinColumn({ name: 'group_id' })  
  group_relation: GroupPermission;
}