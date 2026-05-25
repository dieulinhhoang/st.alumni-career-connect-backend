import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  findAll() {
    return [
      { id: 'r1', title: 'Báo cáo tổng hợp năng lực người học', type: 'academic', status: 'completed', createdBy: 'Admin', createdAt: new Date().toISOString() },
      { id: 'r2', title: 'Thống kê việc làm sau tốt nghiệp', type: 'employment', status: 'completed', createdBy: 'Admin', createdAt: new Date().toISOString() },
    ];
  }

  generate(_body: any) {
    return {
      currentUser: {
        id: 'u1',
        name: 'Administrator',
        scope: 'school',
        facultyName: '',
        majorName: '',
      },
      stats: {
        totalGraduates: 1200,
        submitted: 960,
        submissionRate: 80,
        employed: 835,
        employmentRate: 87,
        relevantJobRate: 68,
        avgSalary: '14.2 triệu',
      },
      majorRows: [],
      graduateRows: [],
      responseRows: [],
      facultyRows: [],
      reportMeta: {
        generatedAt: new Date().toISOString(),
        surveyName: 'Khảo sát việc làm',
        surveyId: 's1',
      },
    };
  }

  getTemplates() {
    return [
      { id: 't1', name: 'Template báo cáo tốt nghiệp', type: 'graduation', fields: ['studentName', 'faculty', 'gpa', 'job'] },
      { id: 't2', name: 'Template thống kê việc làm', type: 'employment', fields: ['studentName', 'company', 'position', 'salary'] },
      { id: 't3', name: 'Template đánh giá doanh nghiệp', type: 'enterprise', fields: ['enterpriseName', 'partnership', 'jobs', 'feedback'] },
    ];
  }
}
