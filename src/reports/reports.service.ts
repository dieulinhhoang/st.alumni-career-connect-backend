import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepo: Repository<Enterprise>,
  ) {}

  async listReports() {
    return [
      { id: 'r1', title: 'Bao cao tong hop nang luc nguoi hoc', type: 'academic', status: 'completed', createdBy: 'Admin', createdAt: new Date().toISOString() },
      { id: 'r2', title: 'Thong ke viec lam sau tot nghiep', type: 'employment', status: 'completed', createdBy: 'Admin', createdAt: new Date().toISOString() },
      { id: 'r3', title: 'Bao cao hop tac doanh nghiep', type: 'enterprise', status: 'pending', createdBy: 'Admin', createdAt: new Date().toISOString() },
    ];
  }

  async generateReport(body: any) {
    const [totalStudents, totalEnterprises] = await Promise.all([
      this.studentRepo.count(),
      this.enterpriseRepo.count(),
    ]);

    const submitted = Math.floor(totalStudents * 0.8);
    const employed = Math.floor(submitted * 0.87);

    return {
      currentUser: {
        id: 'u1',
        name: 'Administrator',
        scope: 'school',
        facultyName: '',
        majorName: '',
      },
      stats: {
        totalGraduates: totalStudents,
        submitted,
        submissionRate: totalStudents ? Math.round((submitted / totalStudents) * 100) : 80,
        employed,
        employmentRate: submitted ? Math.round((employed / submitted) * 100) : 87,
        relevantJobRate: 68,
        avgSalary: '14.2 triệu',
      },
      majorRows: [
        { major: 'Cong nghe thong tin', totalGraduates: 320, submitted: 280, employed: 245, employmentRate: 87.5 },
        { major: 'Kinh te', totalGraduates: 240, submitted: 200, employed: 168, employmentRate: 84 },
        { major: 'Nong nghiep', totalGraduates: 310, submitted: 240, employed: 192, employmentRate: 80 },
        { major: 'Moi truong', totalGraduates: 180, submitted: 140, employed: 105, employmentRate: 75 },
      ],
      graduateRows: [],
      responseRows: [],
      facultyRows: [
        { facultyName: 'Khoa CNTT', totalGraduates: 320, submitted: 280, submissionRate: 87.5 },
        { facultyName: 'Khoa Kinh te', totalGraduates: 240, submitted: 200, submissionRate: 83.3 },
      ],
      reportMeta: {
        generatedAt: new Date().toISOString(),
        surveyName: body?.surveyName ?? 'Khao sat viec lam',
        surveyId: body?.surveyId ?? 's1',
        totalEnterprises,
      },
    };
  }

  getTemplates() {
    return [
      { id: 't1', name: 'Template bao cao tot nghiep', type: 'graduation', fields: ['studentName', 'faculty', 'gpa', 'job'] },
      { id: 't2', name: 'Template thong ke viec lam', type: 'employment', fields: ['studentName', 'company', 'position', 'salary'] },
      { id: 't3', name: 'Template danh gia doanh nghiep', type: 'enterprise', fields: ['enterpriseName', 'partnership', 'jobs', 'feedback'] },
    ];
  }
}
