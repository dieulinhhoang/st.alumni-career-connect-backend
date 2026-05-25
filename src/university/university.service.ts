import { Injectable } from '@nestjs/common';

@Injectable()
export class UniversityService {
  getInfo() {
    return {
      name: 'Học viện Nông nghiệp Việt Nam',
      abbr: 'VNUA',
      address: 'Trâu Quỳ, Gia Lâm, Hà Nội',
      website: 'https://vnua.edu.vn',
      email: 'dhnn@vnua.edu.vn',
      phone: '024 6261 7506',
      logo: '/assets/logo-vnua.png',
    };
  }

  getCalendar() {
    const now = new Date();
    return [
      {
        id: 1,
        title: 'Tổng kết học kỳ I',
        date: new Date(now.getFullYear(), 0, 15).toISOString(),
        type: 'academic',
      },
      {
        id: 2,
        title: 'Bảo vệ luận văn đợt 1',
        date: new Date(now.getFullYear(), 3, 20).toISOString(),
        type: 'graduation',
      },
      {
        id: 3,
        title: 'Hội chợ việc làm thường niên',
        date: new Date(now.getFullYear(), 4, 10).toISOString(),
        type: 'career',
      },
      {
        id: 4,
        title: 'Bảo vệ luận văn đợt 2',
        date: new Date(now.getFullYear(), 9, 15).toISOString(),
        type: 'graduation',
      },
    ];
  }

  getNotifications() {
    return [
      {
        id: 1,
        title: 'Thông báo mở đắng ký khảo sát việc làm 2025',
        content: 'Các cựu sinh viên tốt nghiệp năm 2024 vui lòng đăng ký khảo sát.',
        date: new Date().toISOString(),
        isRead: false,
        type: 'survey',
      },
      {
        id: 2,
        title: 'Hội chợ việc làm sắp diễn ra',
        content: 'VNUA Career Fair 2025 sẽ được tổ chức vào ngày 10/5/2025.',
        date: new Date(Date.now() - 86400000).toISOString(),
        isRead: false,
        type: 'event',
      },
    ];
  }
}
