import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { Job } from '../jobs/entities/job.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Enterprise)
    private enterpriseRepo: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
  ) {}

  async getStatistics() {
    const totalAlumni = await this.studentRepo.count();
    const totalEnterprises = await this.enterpriseRepo.count();
    const totalJobsPosted = await this.jobRepo.count();

    return {
      overview: {
        totalAlumni,
        totalStudents: totalAlumni,
        totalFaculties: 12,
        totalEnterprises,
        totalJobsPosted,
      },
      employmentRate: 78.3,
      averageSalary: 15.5,
      alumniByBatch: [],
      graduatesByFaculty: [],
      recentStats: [
        { label: 'Tỷ lệ có việc làm', value: 78.3, change: '+2%' },
        { label: 'Lương trung bình (triệu)', value: 15.5, change: '+5%' },
        { label: 'Doanh nghiệp hợp tác', value: totalEnterprises, change: '' },
        { label: 'Việc làm đăng tuyển', value: totalJobsPosted, change: '' },
      ],
    };
  }
}
