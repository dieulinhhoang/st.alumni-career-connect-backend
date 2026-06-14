import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Faculty } from '../database/entities/faculty.entity';
import { Major } from '../database/entities/major.entity';
import { Student } from '../database/entities/student.entity';
import { GraduationStudent } from '../database/entities/graduation-student.entity';
import { FacultyReportSubmission } from '../database/entities/faculty-report-submission.entity';

// TypeORM trả các cột bigint dưới dạng string (vd id: '11'), trong khi
// `Number(filters.facultyId)` / `Number(filters.majorId)` là number.
// Toàn bộ fixture dưới đây mô phỏng đúng kiểu string đó để bắt được lỗi
// so sánh "1" !== 1 (xem fix tại reports.service.ts).

const mockBatch = {
  id: '8',
  title: 'KSVL Test',
  formId: '103',
  formSnapshot: { questions: [] },
  status: 'active',
  startDate: '2026-06-06',
  endDate: '2026-06-13',
  year: 2024,
  graduationPeriod: 'Tốt nghiệp đợt 2 - 2024',
  graduationId: '4',
  totalStudents: 13,
} as unknown as AlumniBatch;

const mockFaculty = { id: '1', name: 'Công nghệ Thông tin', status: 1 } as unknown as Faculty;

const mockMajor = {
  id: '11',
  code: 'MMTTDL',
  name: 'Mạng máy tính & Truyền dữ liệu',
  facultyId: '1',
  status: 1,
} as unknown as Major;

const mockStudent = {
  id: '40',
  code: '6665591',
  fullName: 'Nguyễn Ngọc Long',
  gender: 'male',
  citizenIdentification: '037203002140',
  trainingIndustryId: '11',
} as unknown as Student;

const mockResponse = {
  id: '49',
  batchId: '8',
  studentId: '6665591',
  studentName: 'Nguyễn Ngọc Long',
  studentEmail: 'ngoclong@example.com',
  studentPhone: '0917002843',
  answers: {},
  status: 'submitted',
  submittedAt: new Date('2026-06-13T12:17:01.000Z'),
  createdAt: new Date('2026-06-13T12:17:01.000Z'),
} as unknown as AlumniBatchResponse;

const mockGraduationStudent = {
  graduationId: '4',
  studentId: '40',
  student: mockStudent,
} as unknown as GraduationStudent;

const mockSubmission = {
  id: '4',
  batchId: '8',
  facultyId: '1',
  status: 'submitted',
} as unknown as FacultyReportSubmission;

/** Mock query builder chainable, trả `result` cho cả getMany() và getRawMany() */
function createQueryBuilderMock(result: any[]) {
  const qb: any = {};
  ['select', 'addSelect', 'innerJoin', 'leftJoin', 'where', 'andWhere', 'groupBy', 'orderBy']
    .forEach((m) => { qb[m] = jest.fn().mockReturnValue(qb); });
  qb.getMany = jest.fn().mockResolvedValue(result);
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('ReportsService.buildReport', () => {
  let service: ReportsService;

  let batchRepo: { findOne: jest.Mock };
  let responseRepo: { createQueryBuilder: jest.Mock };
  let facultyRepo: { find: jest.Mock; findOneBy: jest.Mock };
  let majorRepo: { find: jest.Mock };
  let studentRepo: { createQueryBuilder: jest.Mock };
  let graduationStudentRepo: { find: jest.Mock; createQueryBuilder: jest.Mock };
  let submissionRepo: { findOne: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    batchRepo = { findOne: jest.fn().mockResolvedValue(mockBatch) };
    responseRepo = { createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock([mockResponse])) };
    facultyRepo = {
      find: jest.fn().mockResolvedValue([mockFaculty]),
      findOneBy: jest.fn().mockResolvedValue(mockFaculty),
    };
    majorRepo = { find: jest.fn().mockResolvedValue([mockMajor]) };
    studentRepo = { createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock([mockStudent])) };
    graduationStudentRepo = {
      find: jest.fn().mockResolvedValue([mockGraduationStudent]),
      createQueryBuilder: jest.fn().mockReturnValue(
        createQueryBuilderMock([{ majorId: '11', total: '13', totalNu: '1' }]),
      ),
    };
    submissionRepo = {
      findOne: jest.fn().mockResolvedValue(mockSubmission),
      find: jest.fn().mockResolvedValue([mockSubmission]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(AlumniBatch), useValue: batchRepo },
        { provide: getRepositoryToken(AlumniBatchResponse), useValue: responseRepo },
        { provide: getRepositoryToken(Faculty), useValue: facultyRepo },
        { provide: getRepositoryToken(Major), useValue: majorRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(GraduationStudent), useValue: graduationStudentRepo },
        { provide: getRepositoryToken(FacultyReportSubmission), useValue: submissionRepo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('trả Mẫu 1 (majorRows) và Mẫu 3 (responseRows) khi khoa đã nộp báo cáo', async () => {
    const admin = { id: 1, isAdmin: true, facultyId: null, name: 'Admin' };

    const result: any = await service.buildReport(
      { surveyId: '8', facultyId: '1' },
      admin,
    );

    expect(result.notSubmitted).toBeUndefined();
    expect(result.majorRows).toHaveLength(1);
    expect(result.majorRows[0].majorCode).toBe('MMTTDL');
    expect(result.responseRows).toHaveLength(1);
    expect(result.graduateRows).toHaveLength(1);
  });

  it('trả báo cáo rỗng khi khoa CHƯA nộp', async () => {
    submissionRepo.findOne.mockResolvedValue({ ...mockSubmission, status: 'draft' });
    const admin = { id: 1, isAdmin: true, facultyId: null, name: 'Admin' };

    const result: any = await service.buildReport(
      { surveyId: '8', facultyId: '1' },
      admin,
    );

    expect(result.notSubmitted).toBe(true);
    expect(result.majorRows).toHaveLength(0);
    expect(result.responseRows).toHaveLength(0);
    expect(result.graduateRows).toHaveLength(0);
  });

  it('khoa luôn xem được báo cáo của chính mình kể cả khi chưa nộp', async () => {
    submissionRepo.findOne.mockResolvedValue({ ...mockSubmission, status: 'draft' });
    const ownFaculty = { id: 2, isAdmin: false, facultyId: '1', name: 'Can bo Khoa CNTT' };

    const result: any = await service.buildReport(
      { surveyId: '8' },
      ownFaculty,
    );

    expect(result.notSubmitted).toBeUndefined();
    expect(result.majorRows).toHaveLength(1);
    expect(result.responseRows).toHaveLength(1);
  });
});
