export class CreateReportDto {
  templateId?: number;
  title?: string;
  graduationId?: number;
  facultyId?: number;
  year?: number;
  filters?: Record<string, any>;
}
