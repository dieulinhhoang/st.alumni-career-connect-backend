export class CreateJobDto {
  enterpriseId: number;
  title: string;
  location?: string;
  salary?: string;
  tags?: string[];
  deadline?: string;
  status?: 'active' | 'closed';
}
