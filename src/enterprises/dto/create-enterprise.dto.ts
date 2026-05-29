export class CreateEnterpriseDto {
  name: string;
  abbr?: string;
  color?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  size?: string;
  address?: string;
  description?: string;
  verified?: number;
  partnerStatus?: 'active' | 'inactive';
  joinedDate?: string;
  faculties?: number[];
}