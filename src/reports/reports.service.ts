import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Graduation } from 'src/database/entities/graduation.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { Major } from 'src/database/entities/major.entity';
import { CreateReportDto } from './dto/create-report.dto';

// In-memory store for generated reports (replace with DB entity if persistence needed)
const reportStore: any[] = [];
let reportIdCounter = 1;

const REPORT_TEMPLATES = [
  {
    id: 1,
    name: 'Báo cáo tổng quát sinh viên tốt nghiệp',
    description: 'Thống kê số lượng sinh viên, ngành học, tỷ lệ việc làm',
    type: 'graduation',
  },
  {
    id: 2,
    name: 'Báo cáo theo khoa',
    description: 'Thống kê sinh viên theo từng khoa đào tạo',
    type: 'faculty',
  },
  {
    id: 3,
    name: 'Báo cáo khảo sát việc làm',
    description: 'Kết quả khảo sát tình trạng việc làm sau tốt nghiệp',
    type: 'survey',
  },
];

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
    @InjectRepository(Graduation)
    private graduationRepository: Repository<Graduation>,
    @InjectRepository(GraduationStudent)
    private graduationStudentRepository: Repository<GraduationStudent>,
    @InjectRepository(Major)
    private majorRepository: Repository<Major>,
  ) {}

  getTemplates() {
    return { items: REPORT_TEMPLATES, total: REPORT_TEMPLATES.length };
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const start = page * size;
    const items = reportStore.slice(start, start + size);
    return {
      items,
      page,
      size,
      total: reportStore.length,
      totalPages: Math.ceil(reportStore.length / size),
    };
  }

  async generate(dto: CreateReportDto) {
    const faculties = await this.facultyRepository.find();
    const majors = await this.majorRepository.find({ relations: ['faculty'] });
    const totalStudents = await this.studentRepository.count();

    // graduatesByFaculty stats
    const graduatesByFaculty: any[] = [];
    for (const faculty of faculties) {
      const count = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoin('student.major', 'major')
        .where('major.facultyId = :facultyId', { facultyId: faculty.id })
        .getCount();
      graduatesByFaculty.push({ faculty: faculty.name, facultyId: faculty.id, count });
    }

    // majorRows
    const majorRows: any[] = [];
    for (const major of majors) {
      const count = await this.studentRepository.count({
        where: { trainingIndustryId: major.id },
      });
      majorRows.push({
        majorId: major.id,
        majorName: major.name,
        faculty: major.faculty?.name ?? '',
        count,
      });
    }

    // graduations for graduateRows
    let graduateRows: any[] = [];
    if (dto.graduationId) {
      const graduation = await this.graduationRepository.findOne({
        where: { id: dto.graduationId },
        relations: ['graduationStudents', 'graduationStudents.student'],
      });
      if (graduation) {
        graduateRows = graduation.graduationStudents.map((gs) => ({
          id: gs.student?.id,
          code: gs.student?.code,
          fullName: gs.student?.fullName,
          email: gs.student?.email,
        }));
      }
    }

    const report = {
      id: reportIdCounter++,
      title: dto.title ?? `Báo cáo #${reportIdCounter - 1}`,
      templateId: dto.templateId ?? null,
      createdAt: new Date().toISOString(),
      filters: dto.filters ?? {},
      stats: {
        totalStudents,
        totalFaculties: faculties.length,
        totalMajors: majors.length,
      },
      graduatesByFaculty,
      majorRows,
      graduateRows,
    };

    reportStore.push(report);
    return report;
  }

  findOne(id: number) {
    const report = reportStore.find((r) => r.id === id);
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    return report;
  }

  remove(id: number) {
    const index = reportStore.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy báo cáo');
    reportStore.splice(index, 1);
    return { message: 'Xóa báo cáo thành công' };
  }
}
