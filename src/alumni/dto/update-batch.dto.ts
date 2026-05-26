import { BatchStatus } from 'src/database/entities/alumni-batch.entity';

export class UpdateBatchDto {
  title?: string;
  description?: string;
  status?: BatchStatus;
  startDate?: string;
  endDate?: string;
  formSnapshot?: Record<string, any>;
  totalStudents?: number;
}
