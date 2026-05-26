export class CreateMajorDto {
  code: string;
  name: string;
  slug?: string;
  description?: string;
  facultyId?: number;
  status?: number;
}
