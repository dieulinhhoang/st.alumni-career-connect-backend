import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Job } from './job.entity';
import { Faculty } from './faculty.entity';

@Entity('job_faculties')
export class JobFaculty {
  @PrimaryColumn({ name: 'job_id', type: 'bigint', unsigned: true })
  jobId: number;

  @PrimaryColumn({ name: 'faculty_id', type: 'bigint', unsigned: true })
  facultyId: number;

  @ManyToOne(() => Job, (job) => job.jobFaculties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Relation<Job>;

  @ManyToOne(() => Faculty, (faculty) => faculty.jobFaculties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Relation<Faculty>;
}
