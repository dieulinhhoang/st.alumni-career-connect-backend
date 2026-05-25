import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Graduation } from 'src/database/entities/graduation.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
    @InjectRepository(Graduation)
    private graduationRepository: Repository<Graduation>,
    @InjectRepository(GraduationStudent)
    private graduationStudentRepository: Repository<GraduationStudent>,
  ) {}

  async getStatistics(query: any) {
    const year = query.year ? Number(query.year) : undefined;
    const facultyId = query.facultyId ? Number(query.facultyId) : undefined;

    const totalAlumni = await this.studentRepository.count();
    const totalGraduations = await this.graduationRepository.count();

    // Employment rate (students with jobTitle or employmentStatus = employed)
    const employedCount = await this.studentRepository
      .createQueryBuilder('student')
      .where('student.employmentStatus = :status', { status: 'employed' })
      .getCount();
    const employmentRate = totalAlumni > 0
      ? Math.round((employedCount / totalAlumni) * 100)
      : 0;

    // Alumni by batch (graduation year)
    const alumniByBatch = await this.getAlumniByBatch(year);

    // Graduates by faculty
    const graduatesByFaculty = await this.getGraduatesByFaculty(facultyId);

    // Response rate from surveys
    const surveyResponseRate = await this.getSurveyResponseRate();

    return {
      overview: {
        totalAlumni,
        totalGraduations,
        employmentRate,
        surveyResponseRate,
      },
      employmentRate,
      alumniByBatch,
      graduatesByFaculty,
    };
  }

  private async getAlumniByBatch(year?: number) {
    const qb = this.graduationRepository
      .createQueryBuilder('graduation')
      .leftJoinAndSelect('graduation.graduationStudents', 'gs');

    if (year) {
      qb.where('graduation.year = :year', { year });
    }

    const graduations = await qb.getMany();

    return graduations.map((g) => ({
      batch: g.name,
      year: g.year,
      count: g.graduationStudents ? g.graduationStudents.length : 0,
    }));
  }

  private async getGraduatesByFaculty(facultyId?: number) {
    const faculties = await this.facultyRepository.find();
    const result: { faculty: string; facultyId: number; count: number }[] = [];

    for (const faculty of faculties) {
      if (facultyId && faculty.id !== facultyId) continue;
      const count = await this.studentRepository
        .createQueryBuilder('student')
        .where('student.facultyId = :facultyId', { facultyId: faculty.id })
        .getCount();
      result.push({ faculty: faculty.name, facultyId: faculty.id, count });
    }

    return result;
  }

  private async getSurveyResponseRate() {
    // Placeholder: ratio responded vs total students
    const totalStudents = await this.studentRepository.count();
    if (totalStudents === 0) return 0;
    return 0; // Will be implemented with survey-response entity
  }
}
