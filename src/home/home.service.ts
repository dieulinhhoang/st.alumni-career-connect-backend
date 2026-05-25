import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Faculty } from 'src/database/entities/faculty.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Enterprise)
    private enterpriseRepository: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
  ) {}

  async getStats() {
    const totalAlumni = await this.studentRepository.count();
    const totalEnterprises = await this.enterpriseRepository.count();
    const totalJobs = await this.jobRepository.count();

    // Jobs posted in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const latestRecruitments = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.createdAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    // Monthly alumni growth (last 6 months)
    const monthlyAlumniGrowth = await this.getMonthlyAlumniGrowth();

    // Faculty distribution
    const facultyDistribution = await this.getFacultyDistribution();

    return {
      totalAlumni,
      totalEnterprises,
      totalJobs,
      latestRecruitments,
      monthlyAlumniGrowth,
      facultyDistribution,
    };
  }

  private async getMonthlyAlumniGrowth() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { month: string; count: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await this.studentRepository
        .createQueryBuilder('student')
        .where('student.createdAt >= :start', { start: d })
        .andWhere('student.createdAt < :end', { end: nextD })
        .getCount();
      result.push({ month: months[d.getMonth()], count });
    }

    return result;
  }

  private async getFacultyDistribution() {
    const faculties = await this.facultyRepository.find();
    const result: { faculty: string; count: number }[] = [];

    for (const faculty of faculties) {
      const count = await this.studentRepository
        .createQueryBuilder('student')
        .where('student.facultyId = :facultyId', { facultyId: faculty.id })
        .getCount();
      result.push({ faculty: faculty.name, count });
    }

    return result;
  }
}
