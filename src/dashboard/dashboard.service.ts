import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Faculty } from 'src/database/entities/faculty.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Enterprise)
    private enterpriseRepo: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Faculty)
    private facultyRepo: Repository<Faculty>,
  ) {}

  async getHomeStats() {
    const totalAlumni = await this.studentRepo.count();
    const totalEnterprises = await this.enterpriseRepo.count();
    const totalJobs = await this.jobRepo.count();

    // Monthly growth: đếm sinh viên theo tháng trong năm hiện tại
    const year = new Date().getFullYear();
    const monthlyAlumniGrowth = await this.studentRepo
      .createQueryBuilder('s')
      .select('MONTH(s.createdAt)', 'monthNum')
      .addSelect('COUNT(*)', 'count')
      .where('YEAR(s.createdAt) = :year', { year })
      .groupBy('MONTH(s.createdAt)')
      .orderBy('monthNum', 'ASC')
      .getRawMany();

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyGrowthFormatted = monthlyAlumniGrowth.map(r => ({
      month: monthNames[parseInt(r.monthNum) - 1],
      count: parseInt(r.count),
    }));

    // Faculty distribution
    const facultyDist = await this.studentRepo
      .createQueryBuilder('s')
      .innerJoin('s.major', 'm')
      .innerJoin('m.faculty', 'f')
      .select('f.name', 'faculty')
      .addSelect('COUNT(s.id)', 'count')
      .groupBy('f.id')
      .orderBy('count', 'DESC')
      .getRawMany();

    const facultyDistFormatted = facultyDist.map(r => ({
      faculty: r.faculty,
      count: parseInt(r.count),
    }));

    return {
      totalAlumni,
      totalEnterprises,
      totalJobs,
      latestRecruitments: totalJobs,
      monthlyAlumniGrowth: monthlyGrowthFormatted,
      facultyDistribution: facultyDistFormatted,
    };
  }

  getWidgets() {
    return {
      quickActions: [
        { id: 'qa1', label: 'Quan ly nguoi dung', icon: 'users', link: '/admin/users' },
        { id: 'qa2', label: 'Quan ly khoa', icon: 'building', link: '/admin/faculties' },
        { id: 'qa3', label: 'Doanh nghiep', icon: 'briefcase', link: '/admin/enterprises' },
        { id: 'qa4', label: 'Bao cao & Thong ke', icon: 'chart', link: '/reports' },
        { id: 'qa5', label: 'Hoi trang', icon: 'globe', link: '/home' },
        { id: 'qa6', label: 'Cau hinh', icon: 'settings', link: '/settings' },
      ],
      activityLog: [
        { id: 'log1', action: 'Admin updated student record', user: 'Admin', timestamp: new Date().toISOString() },
        { id: 'log2', action: 'New enterprise registered', user: 'System', timestamp: new Date().toISOString() },
        { id: 'log3', action: 'Report generated: Employment Stats', user: 'Admin', timestamp: new Date().toISOString() },
      ],
    };
  }
}
