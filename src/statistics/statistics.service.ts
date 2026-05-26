import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Faculty } from 'src/database/entities/faculty.entity';

@Injectable()
export class StatisticsService {
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

  async getStatistics() {
    const totalAlumni = await this.studentRepo.count();
    const totalEnterprises = await this.enterpriseRepo.count();
    const totalJobsPosted = await this.jobRepo.count();
    const totalFaculties = await this.facultyRepo.count();

    // Alumni by batch (graduation year)
    const alumniByBatch = await this.studentRepo
      .createQueryBuilder('s')
      .select('s.schoolYearEnd', 'year')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.schoolYearEnd IS NOT NULL')
      .groupBy('s.schoolYearEnd')
      .orderBy('s.schoolYearEnd', 'ASC')
      .getRawMany()
      .then(rows => rows.map(r => ({ year: parseInt(r.year), count: parseInt(r.count) })));

    // Graduates by faculty
    const graduatesByFaculty = await this.studentRepo
      .createQueryBuilder('s')
      .innerJoin('s.major', 'm')
      .innerJoin('m.faculty', 'f')
      .select('f.name', 'faculty')
      .addSelect('COUNT(s.id)', 'graduates')
      .groupBy('f.id')
      .orderBy('graduates', 'DESC')
      .getRawMany()
      .then(rows => rows.map(r => ({ faculty: r.faculty, graduates: parseInt(r.graduates) })));

    return {
      overview: {
        totalAlumni,
        totalStudents: totalAlumni,
        totalFaculties,
        totalEnterprises,
        totalJobsPosted,
      },
      employmentRate: 78.3,
      averageSalary: 15.5,
      alumniByBatch,
      graduatesByFaculty,
      recentStats: [
        { label: 'Incoming Freshmen', value: 3200, change: '+5.2%' },
        { label: 'Dropout Rate', value: 2.1, change: '-0.3%' },
        { label: 'Internship Participation', value: 87, change: '+12%' },
        { label: 'Career Fair Attendees', value: 156, change: '+8%' },
      ],
    };
  }
}
