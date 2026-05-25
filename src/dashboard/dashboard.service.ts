import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  getWidgets() {
    return {
      quickActions: [
        { id: 'qa1', label: 'Quản lý người dùng', icon: 'users', link: '/admin/users' },
        { id: 'qa2', label: 'Quản lý khoa', icon: 'building', link: '/admin/faculties' },
        { id: 'qa3', label: 'Doanh nghiệp', icon: 'briefcase', link: '/admin/enterprises' },
        { id: 'qa4', label: 'Báo cáo & Thống kê', icon: 'chart', link: '/reports' },
        { id: 'qa5', label: 'Hội trang', icon: 'globe', link: '/home' },
        { id: 'qa6', label: 'Cấu hình', icon: 'settings', link: '/settings' },
      ],
      activityLog: [
        { id: 'log1', action: 'Admin cập nhật hồ sơ sinh viên', user: 'Admin', timestamp: new Date().toISOString() },
        { id: 'log2', action: 'Doanh nghiệp mới đăng ký', user: 'System', timestamp: new Date().toISOString() },
        { id: 'log3', action: 'Báo cáo được tạo: Thống kê việc làm', user: 'Admin', timestamp: new Date().toISOString() },
      ],
    };
  }
}
