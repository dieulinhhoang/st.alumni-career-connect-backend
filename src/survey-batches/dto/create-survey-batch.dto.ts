export class CreateSurveyBatchDto {
  title: string;
  description?: string;
  formId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
  graduationPeriod?: string;
  totalStudents?: number;
}
