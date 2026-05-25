import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Graduation } from 'src/database/entities/graduation.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Faculty)
    private facultyRepo: Repository<Faculty>,
    @InjectRepository(Enterprise)
    private enterpriseRepo: Repository<Enterprise>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Graduation)
    private graduationRepo: Repository<Graduation>,
  ) {}

  async getStatistics() {
    const [totalStudents, totalFaculties, totalEnterprises, totalJobsPosted] =
      await Promise.all([
        this.studentRepo.count(),
        this.facultyRepo.count(),
        this.enterpriseRepo.count(),
        this.jobRepo.count(),
      ]);

    // Alumni = students who have graduated (có trong bảng graduation_students)
    const totalAlumni = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.school_year_end IS NOT NULL')
      .getCount();

    // Tỉ lệ có việc (từ survey answers - nếu chưa có data dùng 0)
    const employmentRate = 0;
    const averageSalary = 0;

    // Alumni by batch (group by school_year_end)
    const alumniByBatchRaw = await this.studentRepo
      .createQueryBuilder('s')
      .select('s.school_year_end', 'year')
      .addSelect('COUNT(*)', 'count')
      .where('s.school_year_end IS NOT NULL')
      .groupBy('s.school_year_end')
      .orderBy('s.school_year_end', 'ASC')
      .getRawMany();

    const alumniByBatch = alumniByBatchRaw.map((r) => ({
      year: Number(r.year),
      count: Number(r.count),
    }));

    // Graduates by faculty
    const facultyRaw = await this.facultyRepo
      .createQueryBuilder('f')
      .leftJoin('f.majors', 'm')
      .leftJoin('m.students', 's')
      .select('f.name', 'faculty')
      .addSelect('COUNT(DISTINCT s.id)', 'graduates')
      .groupBy('f.id')
      .getRawMany();

    const graduatesByFaculty = facultyRaw.map((r) => ({
      faculty: r.faculty,
      graduates: Number(r.graduates),
    }));

    const recentStats = [
      { label: 'Dropout Rate', value: 0, change: '0%' },
      { label: 'Internship Participation', value: 0, change: '0%' },
      { label: 'Career Fair Attendees', value: 0, change: '0%' },
    ];

    return {
      overview: {
        totalAlumni,
        totalStudents,
        totalFaculties,
        totalEnterprises,
        totalJobsPosted,
      },
      employmentRate,
      averageSalary,
      alumniByBatch,
      graduatesByFaculty,
      recentStats,
    };
  }
}
