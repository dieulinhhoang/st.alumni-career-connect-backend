import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from 'src/database/entities/faculty.entity';

@Injectable()
export class UniversityService {
  constructor(
    @InjectRepository(Faculty)
    private facultyRepo: Repository<Faculty>,
  ) {}

  async getUniversity() {
    const faculties = await this.facultyRepo.find({ select: ['name'] });
    const facultyNames = faculties.map(f => f.name);

    return {
      name: 'Hoc vien Nong nghiep Viet Nam',
      abbr: 'VNUA',
      logo: '/assets/logo.png',
      motto: 'H\u1ecdc t\u1eadp - S\u00e1ng t\u1ea1o - Ph\u00e1t tri\u1ec3n',
      founded: 1956,
      address: 'Trau Quy, Gia Lam, Ha Noi',
      phone: '024 3827 6346',
      email: 'info@vnua.edu.vn',
      website: 'https://www.vnua.edu.vn',
      totalFaculties: faculties.length,
      totalPrograms: 48,
      faculties: facultyNames,
      latestNews: [
        { id: 'n1', title: 'Ky le tot nghiep thang 6.2026', date: '2026-06-15' },
        { id: 'n2', title: 'Hoi thao chuyen de AI trong giao duc', date: '2026-05-20' },
        { id: 'n3', title: 'Hop tac doanh nghiep FPT Software', date: '2026-04-10' },
      ],
    };
  }

  getCalendar() {
    return [
      { id: 'c1', event: 'Lop hoc ky moi - Nganh CNTT', date: '2026-09-01', type: 'academic' },
      { id: 'c2', event: 'Ngay hoi viec lam', date: '2026-10-15', type: 'career' },
      { id: 'c3', event: 'Bao ve luan van tot nghiep', date: '2026-06-20', type: 'graduation' },
      { id: 'c4', event: 'Hoi thao doanh nghiep', date: '2026-11-25', type: 'enterprise' },
    ];
  }

  getNotifications() {
    return [
      { id: 'not1', title: 'Thong bao lich diem ky 2/2026', date: '2026-03-01', priority: 'high', read: false },
      { id: 'not2', title: 'Dang ky mon hoc phong van xin viec', date: '2026-02-28', priority: 'medium', read: true },
      { id: 'not3', title: 'Thay doi lich giang giang vien', date: '2026-02-25', priority: 'low', read: true },
    ];
  }
}
