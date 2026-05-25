import { Injectable } from '@nestjs/common';

@Injectable()
export class UniversityService {
  getUniversity() {
    return {
      name: 'Hoc vien Nong nghiep Viet Nam',
      abbr: 'VNUA',
      logo: '/assets/logo.png',
      motto: 'Hoc tap - Sang tao - Phat trien',
      founded: 1956,
      address: 'Trau Quy, Gia Lam, Ha Noi',
      phone: '024 3827 6346',
      email: 'info@vnua.edu.vn',
      website: 'https://www.vnua.edu.vn',
      totalStudents: 25000,
      totalFaculties: 12,
      totalPrograms: 45,
      faculties: [
        'Khoa Cong nghe thong tin',
        'Khoa Kinh te',
        'Khoa Nong hoc',
        'Khoa Chan nuoi',
        'Khoa Thu y',
        'Khoa Co khi & Cong nghe',
      ],
      latestNews: [
        { id: 'n1', title: 'Le tot nghiep thang 6/2025', date: '2025-06-15' },
        { id: 'n2', title: 'Hoi thao chuyen de AI trong nong nghiep', date: '2025-05-20' },
        { id: 'n3', title: 'Hop tac doanh nghiep FPT Software', date: '2025-04-10' },
      ],
    };
  }

  getCalendar() {
    return [
      { id: 'c1', event: 'Ky hoc moi - Nganh CNTT', date: '2025-09-01', type: 'academic' },
      { id: 'c2', event: 'Ngay hoi viec lam VNUA 2025', date: '2025-06-15', type: 'career' },
      { id: 'c3', event: 'Bao ve luan van tot nghiep', date: '2025-06-20', type: 'graduation' },
      { id: 'c4', event: 'Hoi thao doanh nghiep - FPT', date: '2025-06-25', type: 'enterprise' },
    ];
  }

  getNotifications() {
    return [
      { id: 'not1', title: 'Thong bao lich thi cuoi ky 2/2025', date: '2025-03-01', priority: 'high', read: false },
      { id: 'not2', title: 'Dang ky hoc phan ky moi', date: '2025-02-28', priority: 'medium', read: true },
      { id: 'not3', title: 'Thay doi lich giang vien khoa CNTT', date: '2025-02-25', priority: 'low', read: true },
    ];
  }
}
