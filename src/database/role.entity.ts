import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  faculty_id: number;
}