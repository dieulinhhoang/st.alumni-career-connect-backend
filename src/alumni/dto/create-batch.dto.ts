export class CreateBatchDto {
  title: string;
  description?: string;
  formId: number;
  formSnapshot?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  year: number;
  graduationPeriod?: string;
  totalStudents?: number;
}
