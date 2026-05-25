import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { Job } from '../jobs/entities/job.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Enterprise)
    private enterpriseRepo: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
  ) {}

  async getHomeStats() {
    const totalAlumni = await this.studentRepo.count();
    const totalEnterprises = await this.enterpriseRepo.count();
    const totalJobs = await this.jobRepo.count();

    return {
      totalAlumni,
      totalEnterprises,
      totalJobs,
      latestRecruitments: 0,
      monthlyAlumniGrowth: [],
      facultyDistribution: [],
    };
  }

  async getUniversity() {
    return {
      name: 'Học viện Nông nghiệp Việt Nam',
      abbr: 'VNUA',
      logo: '/assets/logo.png',
      motto: 'Học tập - Sáng tạo - Phát triển',
      founded: 1956,
      address: 'Trâu Quỳ, Gia Lâm, Hà Nội',
      phone: '024 3827 6346',
      email: 'info@vnua.edu.vn',
      website: 'https://www.vnua.edu.vn',
      totalStudents: 28500,
      totalFaculties: 12,
      totalPrograms: 48,
      faculties: [
        'Khoa Công nghệ thông tin',
        'Khoa Kinh tế',
        'Khoa Nông học',
        'Khoa Chăn nuôi',
        'Khoa Thú y',
        'Khoa Môi trường',
      ],
      latestNews: [],
    };
  }

  async getCalendar() {
    return [];
  }

  async getNotifications() {
    return [];
  }

  async getAlumniProfiles() {
    const students = await this.studentRepo.find({ take: 50 });
    return students.map((s: any) => ({
      id: s.id,
      studentCode: s.code || s.studentCode || '',
      fullName: s.full_name || s.fullName || '',
      major: s.training_industry_name || s.major || '',
      graduationYear: s.school_year_end || s.graduationYear || null,
      currentPosition: '',
      currentCompany: '',
      email: s.email || '',
    }));
  }
}
