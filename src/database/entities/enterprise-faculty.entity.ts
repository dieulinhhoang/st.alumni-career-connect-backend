import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Enterprise } from './enterprise.entity';
import { Faculty } from './faculty.entity';

@Entity('enterprise_faculties')
export class EnterpriseFaculty {
  @PrimaryColumn({ name: 'enterprise_id', type: 'bigint', unsigned: true })
  enterpriseId: number;

  @PrimaryColumn({ name: 'faculty_id', type: 'bigint', unsigned: true })
  facultyId: number;

  @ManyToOne(() => Enterprise, (enterprise) => enterprise.enterpriseFaculties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: Relation<Enterprise>;

  @ManyToOne(() => Faculty, (faculty) => faculty.enterpriseFaculties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Relation<Faculty>;
}
