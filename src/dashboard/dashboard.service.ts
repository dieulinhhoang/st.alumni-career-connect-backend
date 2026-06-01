import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';

interface ChartQuery {
  khoa?: string;
  nganh?: string;
  mode?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Faculty)
    private readonly facultyRepository: Repository<Faculty>,
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
  ) {}

  async getSummary() {
    const totalStudents = await this.studentRepository.count();

    return {
      latestDot: 'Đợt mới nhất',
      responseRate: {
        value: 0,
        total: totalStudents,
        trend: '',
      },
      employedRateOnResponses: {
        value: 0,
        trend: '',
      },
      employedRateOnGraduates: {
        value: 0,
        trend: '',
      },
      relevantJobRate: {
        value: 0,
        trend: '',
      },
    };
  }

  getWidgets() {
    return [
      {
        id: 'quick-actions',
        title: 'Thao tác nhanh',
        type: 'list',
        data: {
          quickActions: [
            { id: 'qa1', label: 'Quản lý người dùng', icon: 'users', link: '/admin/users' },
            { id: 'qa2', label: 'Quản lý khoa', icon: 'building', link: '/admin/faculties' },
            { id: 'qa3', label: 'Doanh nghiệp', icon: 'briefcase', link: '/admin/enterprises' },
            { id: 'qa4', label: 'Báo cáo & Thống kê', icon: 'chart', link: '/reports' },
            { id: 'qa5', label: 'Hội trang', icon: 'globe', link: '/home' },
            { id: 'qa6', label: 'Cấu hình', icon: 'settings', link: '/settings' },
          ],
        },
      },
      {
        id: 'activity-log',
        title: 'Hoạt động gần đây',
        type: 'list',
        data: {
          activityLog: [
            {
              id: 'log1',
              action: 'Admin updated student record',
              user: 'Admin',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'log2',
              action: 'New enterprise registered',
              user: 'System',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'log3',
              action: 'Report generated: Employment Stats',
              user: 'Admin',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
    ];
  }

  async getChartData(query: ChartQuery) {
    const mode = (query.mode || 'coviec').toLowerCase();
    const khoa = query.khoa || 'all';
    const nganh = query.nganh || 'all';

    if (mode === 'khuvuc') {
      return [
        { label: 'Tư nhân', value: await this.countStudents(khoa, nganh) },
        { label: 'Nhà nước', value: 0 },
        { label: 'Tự tạo việc', value: 0 },
        { label: 'Nước ngoài', value: 0 },
      ];
    }

    if (mode === 'tinhhinh') {
      const total = await this.countStudents(khoa, nganh);
      return [
        { label: 'Đúng ngành', value: total },
        { label: 'Liên quan', value: 0 },
        { label: 'Trái ngành', value: 0 },
        { label: 'Tiếp tục học', value: 0 },
        { label: 'Chưa có việc', value: 0 },
      ];
    }

    const total = await this.countStudents(khoa, nganh);
    return [
      { label: 'Có việc làm', value: total },
      { label: 'Chưa có việc', value: 0 },
    ];
  }

  private async countStudents(khoa: string, nganh: string): Promise<number> {
    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.faculty', 'faculty')
      .leftJoin('student.major', 'major');

    if (khoa !== 'all') {
      qb.andWhere('(faculty.abbr = :khoa OR faculty.slug = :khoa OR faculty.name = :khoa)', { khoa });
    }

    if (nganh !== 'all') {
      qb.andWhere('(major.code = :nganh OR major.slug = :nganh OR major.name = :nganh)', { nganh });
    }

    return qb.getCount();
  }

  async getChartData(query: ChartQuery) {
    const mode = (query.mode || 'coviec').toLowerCase();
    const khoa = query.khoa || 'all';
    const nganh = query.nganh || 'all';

    if (mode === 'khuvuc') {
      return [
        { label: 'Tư nhân', value: await this.countStudents(khoa, nganh) },
        { label: 'Nhà nước', value: 0 },
        { label: 'Tự tạo việc', value: 0 },
        { label: 'Nước ngoài', value: 0 },
      ];
    }

    if (mode === 'tinhhinh') {
      const total = await this.countStudents(khoa, nganh);
      return [
        { label: 'Đúng ngành', value: total },
        { label: 'Liên quan', value: 0 },
        { label: 'Trái ngành', value: 0 },
        { label: 'Tiếp tục học', value: 0 },
        { label: 'Chưa có việc', value: 0 },
      ];
    }

    const total = await this.countStudents(khoa, nganh);
    return [
      { label: 'Có việc làm', value: total },
      { label: 'Chưa có việc', value: 0 },
    ];
  }

  private async countStudents(khoa: string, nganh: string): Promise<number> {
    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.faculty', 'faculty')
      .leftJoin('student.major', 'major');

    if (khoa !== 'all') {
      qb.andWhere('(faculty.abbr = :khoa OR faculty.slug = :khoa OR faculty.name = :khoa)', { khoa });
    }

    if (nganh !== 'all') {
      qb.andWhere('(major.code = :nganh OR major.slug = :nganh OR major.name = :nganh)', { nganh });
    }

    return qb.getCount();
  }
}