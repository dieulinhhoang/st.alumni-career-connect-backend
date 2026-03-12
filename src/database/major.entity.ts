import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Student } from './student.entity';

@Entity('major')
export class Major {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ unique: true })
  code: string; // Mã ngành (ví dụ: 'NNA', 'CNTT')

  @Column()
  name: string; // Tên ngành (ví dụ: 'Ngôn ngữ Anh', 'Công nghệ thông tin')

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number; // 1: Active, 0: Inactive

  // Quan hệ 1 ngành có nhiều sinh viên
  @OneToMany(() => Student, (student) => student.major)
  students: Student[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}