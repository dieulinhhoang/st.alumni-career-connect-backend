import { Injectable, NotFoundException } from '@nestjs/common';

// In-memory stores
const calendarStore: any[] = [
  { id: 1, title: 'Lễ tốt nghiệp 2024', startDate: '2024-12-20', endDate: '2024-12-20', type: 'graduation', description: 'Lễ tốt nghiệp khóa 2020-2024' },
  { id: 2, title: 'Ngày hội việc làm 2025', startDate: '2025-03-15', endDate: '2025-03-15', type: 'career', description: 'Hội chợ việc làm thường niên' },
  { id: 3, title: 'Khảo sát việc làm kỳ 1', startDate: '2025-01-01', endDate: '2025-02-28', type: 'survey', description: 'Khảo sát tình trạng việc làm' },
];
let calendarIdCounter = 4;

const notificationsStore: any[] = [
  { id: 1, title: 'Hệ thống được cập nhật', content: 'Hệ thống đã được nâng cấp lên phiên bản mới', isRead: false, type: 'system', createdAt: new Date().toISOString() },
  { id: 2, title: 'Mở kỳ khảo sát mới', content: 'Kỳ khảo sát việc làm 2025 đã bắt đầu', isRead: false, type: 'survey', createdAt: new Date().toISOString() },
];
let notificationIdCounter = 3;

const UNIVERSITY_INFO = {
  id: 1,
  name: 'Học viện Nông nghiệp Việt Nam',
  shortName: 'VNUA',
  address: 'Trâu Quỳ, Gia Lâm, Hà Nội',
  phone: '024.62617586',
  email: 'info@vnua.edu.vn',
  website: 'https://www.vnua.edu.vn',
  logo: '/assets/logo-vnua.png',
  foundedYear: 1956,
};

@Injectable()
export class UniversityService {
  getInfo() {
    return UNIVERSITY_INFO;
  }

  getCalendar(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 20);
    const type = query.type?.trim();
    let items = type ? calendarStore.filter((e) => e.type === type) : [...calendarStore];
    const total = items.length;
    items = items.slice(page * size, page * size + size);
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  createCalendarEvent(body: any) {
    const event = { id: calendarIdCounter++, ...body, createdAt: new Date().toISOString() };
    calendarStore.push(event);
    return event;
  }

  updateCalendarEvent(id: number, body: any) {
    const index = calendarStore.findIndex((e) => e.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy sự kiện');
    calendarStore[index] = { ...calendarStore[index], ...body };
    return calendarStore[index];
  }

  removeCalendarEvent(id: number) {
    const index = calendarStore.findIndex((e) => e.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy sự kiện');
    calendarStore.splice(index, 1);
    return { message: 'Xóa sự kiện thành công' };
  }

  getNotifications(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const isRead = query.isRead !== undefined ? query.isRead === 'true' : undefined;
    let items = isRead !== undefined
      ? notificationsStore.filter((n) => n.isRead === isRead)
      : [...notificationsStore];
    const total = items.length;
    const unreadCount = notificationsStore.filter((n) => !n.isRead).length;
    items = items.slice(page * size, page * size + size);
    return { items, page, size, total, totalPages: Math.ceil(total / size), unreadCount };
  }

  createNotification(body: any) {
    const notification = {
      id: notificationIdCounter++,
      ...body,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notificationsStore.push(notification);
    return notification;
  }

  markAsRead(id: number) {
    const index = notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy thông báo');
    notificationsStore[index].isRead = true;
    return notificationsStore[index];
  }

  removeNotification(id: number) {
    const index = notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy thông báo');
    notificationsStore.splice(index, 1);
    return { message: 'Xóa thông báo thành công' };
  }
}
