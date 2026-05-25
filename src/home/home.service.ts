import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Graduation } from 'src/database/entities/graduation.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Enterprise)
    private enterpriseRepo: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Graduation)
    private graduationRepo: Repository<Graduation>,
  ) {}

  async getStats() {
    const [totalAlumni, totalEnterprises, totalJobsPosted, totalGraduationBatches] =
      await Promise.all([
        this.studentRepo.count({ where: { school_year_end: undefined } }).catch(() => this.studentRepo.count()),
        this.enterpriseRepo.count(),
        this.jobRepo.count(),
        this.graduationRepo.count(),
      ]);

    return [
      {
        id: 'alumni',
        label: 'Tổng cựu sinh viên',
        value: totalAlumni,
        unit: 'người',
        icon: 'users',
        change: '+5%',
        trend: 'up',
      },
      {
        id: 'enterprises',
        label: 'Doanh nghiệp đối tác',
        value: totalEnterprises,
        unit: 'doanh nghiệp',
        icon: 'building',
        change: '+3%',
        trend: 'up',
      },
      {
        id: 'jobs',
        label: 'Việc làm tẫm tuyển',
        value: totalJobsPosted,
        unit: 'vị trí',
        icon: 'briefcase',
        change: '+12%',
        trend: 'up',
      },
      {
        id: 'graduations',
        label: 'Đợt tốt nghiệp',
        value: totalGraduationBatches,
        unit: 'đợt',
        icon: 'graduation-cap',
        change: '0%',
        trend: 'stable',
      },
    ];
  }
}
