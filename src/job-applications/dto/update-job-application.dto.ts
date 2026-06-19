import { IsIn } from 'class-validator';
import type { ApplicationStatus } from 'src/database/entities/job-application.entity';

export class UpdateJobApplicationDto {
  @IsIn(['pending', 'reviewed', 'shortlisted', 'rejected'])
  status: ApplicationStatus;
}
