import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from '../entities/faculty.entity';
import { Major } from '../entities/major.entity';
import { Student } from '../entities/student.entity';
import { Graduation } from '../entities/graduation.entity';
import { GraduationStudent } from '../entities/graduation-student.entity';
import { Enterprise } from '../entities/enterprise.entity';
import { EnterpriseFaculty } from '../entities/enterprise-faculty.entity';
import { Job } from '../entities/job.entity';
import { JobFaculty } from '../entities/job-faculty.entity';
import { Survey } from '../entities/survey.entity';
import { SurveySection } from '../entities/survey-section.entity';
import { SurveyQuestion } from '../entities/survey-question.entity';
import { SurveyGraduation } from '../entities/survey-graduation.entity';
import { SurveyResponse } from '../entities/survey-response.entity';
import { SurveyAnswer } from '../entities/survey-answer.entity';
import { GroupPermission } from '../entities/group-permission.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { StatIndicatorConfig } from '../entities/stat-indicator-config.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Faculty) private facultyRepo: Repository<Faculty>,
    @InjectRepository(Major) private majorRepo: Repository<Major>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Graduation) private graduationRepo: Repository<Graduation>,
    @InjectRepository(GraduationStudent) private graduationStudentRepo: Repository<GraduationStudent>,
    @InjectRepository(Enterprise) private enterpriseRepo: Repository<Enterprise>,
    @InjectRepository(EnterpriseFaculty) private entFacultyRepo: Repository<EnterpriseFaculty>,
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(JobFaculty) private jobFacultyRepo: Repository<JobFaculty>,
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(SurveySection) private sectionRepo: Repository<SurveySection>,
    @InjectRepository(SurveyQuestion) private questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(SurveyGraduation) private surveyGradRepo: Repository<SurveyGraduation>,
    @InjectRepository(SurveyResponse) private responseRepo: Repository<SurveyResponse>,
    @InjectRepository(SurveyAnswer) private answerRepo: Repository<SurveyAnswer>,
    @InjectRepository(GroupPermission) private groupPermRepo: Repository<GroupPermission>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(StatIndicatorConfig) private statConfigRepo: Repository<StatIndicatorConfig>,
  ) {}

  async run() {
    const count = await this.facultyRepo.count();
  if (count > 0) {
    console.log(' Data đã tồn tại, bỏ qua seed.');
    return;
  }
    console.log('🌱 Bắt đầu seed dữ liệu...');

    const faculties = await this.seedFaculties();
    const majors = await this.seedMajors(faculties);
    const students = await this.seedStudents(majors);
    const graduations = await this.seedGraduations(faculties);
    await this.seedGraduationStudents(graduations, students);
    const enterprises = await this.seedEnterprises();
    await this.seedEnterpriseFaculties(enterprises, faculties);
    const jobs = await this.seedJobs(enterprises);
    await this.seedJobFaculties(jobs, faculties);
    const surveys = await this.seedSurveys();
    const sections = await this.seedSurveySections(surveys);
    const questions = await this.seedSurveyQuestions(surveys, sections);
    await this.seedSurveyGraduations(surveys, graduations);
    const responses = await this.seedSurveyResponses(surveys, students);
    await this.seedSurveyAnswers(responses, questions);
    const groupPerms = await this.seedGroupPermissions();
    const perms = await this.seedPermissions(groupPerms);
    const roles = await this.seedRoles(faculties);
    await this.seedRolePermissions(roles, perms);
    const users = await this.seedUsers();
    await this.seedUserRoles(users, roles);
    await this.seedStatIndicatorConfigs();

    console.log('✅ Seed dữ liệu hoàn tất!');
  }

  // ─── FACULTIES ───────────────────────────────────────────────
  private async seedFaculties(): Promise<Faculty[]> {
    const data = [
      { name: 'Công nghệ Thông tin', abbr: 'CNTT', slug: 'cong-nghe-thong-tin', color: '#3B82F6' },
      { name: 'Kế toán - Tài chính', abbr: 'KTTC', slug: 'ke-toan-tai-chinh', color: '#10B981' },
      { name: 'Quản trị Kinh doanh', abbr: 'QTKD', slug: 'quan-tri-kinh-doanh', color: '#F59E0B' },
      { name: 'Kỹ thuật Điện - Điện tử', abbr: 'KTDD', slug: 'ky-thuat-dien-dien-tu', color: '#EF4444' },
      { name: 'Ngoại ngữ', abbr: 'NN', slug: 'ngoai-ngu', color: '#8B5CF6' },
    ];
    const entities = data.map((d) => this.facultyRepo.create({ ...d, status: 1 }));
    return this.facultyRepo.save(entities);
  }

  // ─── MAJORS ──────────────────────────────────────────────────
  private async seedMajors(faculties: Faculty[]): Promise<Major[]> {
    const [cntt, kttc, qtkd, ktdd, nn] = faculties;
    const data = [
      { code: 'KTPM', name: 'Kỹ thuật Phần mềm', facultyId: cntt.id },
      { code: 'HTTT', name: 'Hệ thống Thông tin', facultyId: cntt.id },
      { code: 'KHMT', name: 'Khoa học Máy tính', facultyId: cntt.id },
      { code: 'KTTC01', name: 'Kế toán Doanh nghiệp', facultyId: kttc.id },
      { code: 'TCNH', name: 'Tài chính Ngân hàng', facultyId: kttc.id },
      { code: 'QTKD01', name: 'Quản trị Kinh doanh tổng hợp', facultyId: qtkd.id },
      { code: 'TMDT', name: 'Thương mại Điện tử', facultyId: qtkd.id },
      { code: 'KTDL', name: 'Kỹ thuật Điện lạnh', facultyId: ktdd.id },
      { code: 'KTDT', name: 'Kỹ thuật Điện tử', facultyId: ktdd.id },
      { code: 'TATM', name: 'Tiếng Anh Thương mại', facultyId: nn.id },
    ];
    const entities = data.map((d) => this.majorRepo.create({ ...d, status: 1 }));
    return this.majorRepo.save(entities);
  }

  // ─── STUDENTS ────────────────────────────────────────────────
  private async seedStudents(majors: Major[]): Promise<Student[]> {
    const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi'];
    const firstNames = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Linh', 'Mai', 'Nam', 'Phúc', 'Quân', 'Thảo', 'Uyên', 'Yến'];
    const data: Partial<Student>[] = [];

    for (let i = 1; i <= 50; i++) {
      const ln = lastNames[i % lastNames.length];
      const fn = firstNames[i % firstNames.length];
      const major = majors[i % majors.length];
      data.push({
        code: `SV${String(i).padStart(5, '0')}`,
        fullName: `${ln} Văn ${fn}`,
        firstName: fn,
        lastName: ln,
        email: `sv${String(i).padStart(5, '0')}@student.edu.vn`,
        phone: `09${String(10000000 + i).slice(1)}`,
        dob: new Date(2000 + (i % 4), i % 12, (i % 28) + 1),
        gender: i % 3 === 0 ? 'other' : i % 2 === 0 ? 'female' : 'male',
        citizenIdentification: String(1000000000 + i),
        trainingIndustryId: major.id,
        schoolYearEnd: `${2022 + (i % 3)}`,
      });
    }

    const entities = data.map((d) => this.studentRepo.create(d as Student));
    return this.studentRepo.save(entities);
  }

  // ─── GRADUATIONS ─────────────────────────────────────────────
  private async seedGraduations(faculties: Faculty[]): Promise<Graduation[]> {
    const data = [
      { name: 'Tốt nghiệp đợt 1 - 2023', certification: 'QĐ-01/2023', certificationDate: new Date('2023-06-30'), schoolYear: 2023, facultyId: faculties[0].id },
      { name: 'Tốt nghiệp đợt 2 - 2023', certification: 'QĐ-02/2023', certificationDate: new Date('2023-12-30'), schoolYear: 2023, facultyId: faculties[1].id },
      { name: 'Tốt nghiệp đợt 1 - 2024', certification: 'QĐ-01/2024', certificationDate: new Date('2024-06-28'), schoolYear: 2024, facultyId: faculties[2].id },
      { name: 'Tốt nghiệp đợt 2 - 2024', certification: 'QĐ-02/2024', certificationDate: new Date('2024-12-27'), schoolYear: 2024, facultyId: faculties[0].id },
    ];
    const entities = data.map((d) => this.graduationRepo.create(d));
    return this.graduationRepo.save(entities);
  }

  // ─── GRADUATION_STUDENTS ─────────────────────────────────────
  private async seedGraduationStudents(graduations: Graduation[], students: Student[]) {
    const data: Partial<GraduationStudent>[] = [];
    const chunkSize = Math.ceil(students.length / graduations.length);
    graduations.forEach((grad, gi) => {
      students.slice(gi * chunkSize, (gi + 1) * chunkSize).forEach((s) => {
        data.push({ graduationId: grad.id, studentId: s.id });
      });
    });
    return this.graduationStudentRepo.save(data.map((d) => this.graduationStudentRepo.create(d as GraduationStudent)));
  }

  // ─── ENTERPRISES ─────────────────────────────────────────────
  private async seedEnterprises(): Promise<Enterprise[]> {
    const data = [
      { name: 'FPT Software', abbr: 'FPT', color: '#F97316', industry: 'Công nghệ thông tin', website: 'https://fpt-software.com', email: 'hr@fpt-software.com', phone: '02473005588', size: '10.000+ nhân viên', address: 'Tòa nhà FPT, Hà Nội', verified: 1, partnerStatus: 'active', joinedDate: '01/2023' },
      { name: 'Viettel Digital Services', abbr: 'VDS', color: '#EF4444', industry: 'Viễn thông - Công nghệ', website: 'https://viettel.com.vn', email: 'tuyendung@viettel.com.vn', phone: '18008168', size: '5.000-10.000 nhân viên', address: '1 Giang Văn Minh, Ba Đình, Hà Nội', verified: 1, partnerStatus: 'active', joinedDate: '03/2023' },
      { name: 'Công ty CP KMS Technology', abbr: 'KMS', color: '#3B82F6', industry: 'Phần mềm', website: 'https://kms-technology.com', email: 'recruit@kms-technology.com', phone: '02838256666', size: '1.000-5.000 nhân viên', address: 'Lotte Mart Tower, Quận 7, TP.HCM', verified: 1, partnerStatus: 'active', joinedDate: '06/2023' },
      { name: 'Vingroup - Vinhomes', abbr: 'VGP', color: '#10B981', industry: 'Bất động sản', website: 'https://vingroup.net', email: 'careers@vingroup.net', phone: '02439740740', size: '10.000+ nhân viên', address: '7 Bà Triệu, Hoàn Kiếm, Hà Nội', verified: 1, partnerStatus: 'active', joinedDate: '02/2024' },
      { name: 'Công ty TNHH Deloitte Việt Nam', abbr: 'DLT', color: '#6366F1', industry: 'Kiểm toán - Tư vấn', website: 'https://deloitte.com/vn', email: 'vn_talent@deloitte.com', phone: '02838221666', size: '500-1.000 nhân viên', address: 'Sunwah Tower, Quận 1, TP.HCM', verified: 1, partnerStatus: 'active', joinedDate: '04/2024' },
      { name: 'Công ty TNHH TMA Solutions', abbr: 'TMA', color: '#8B5CF6', industry: 'Công nghệ thông tin', website: 'https://tmasolutions.com', email: 'hr@tmasolutions.com', phone: '02838305566', size: '1.000-5.000 nhân viên', address: 'Quang Trung Software City, TP.HCM', verified: 0, partnerStatus: 'active', joinedDate: '07/2024' },
    ];
    const entities = data.map((d) => this.enterpriseRepo.create(d as Partial<Enterprise>));
    return this.enterpriseRepo.save(entities);
  }

  // ─── ENTERPRISE_FACULTIES ────────────────────────────────────
  private async seedEnterpriseFaculties(enterprises: Enterprise[], faculties: Faculty[]) {
    const pairs = [
      [0, 0], [0, 1], [1, 0], [1, 3], [2, 0], [3, 2], [3, 1], [4, 1], [5, 0], [5, 3],
    ];
    const data = pairs.map(([ei, fi]) =>
      this.entFacultyRepo.create({ enterpriseId: enterprises[ei].id, facultyId: faculties[fi].id }),
    );
    return this.entFacultyRepo.save(data);
  }

  // ─── JOBS ────────────────────────────────────────────────────
  private async seedJobs(enterprises: Enterprise[]): Promise<Job[]> {
    const data = [
      { enterpriseId: enterprises[0].id, title: 'Lập trình viên Java Backend', location: 'Hà Nội', salary: '15 - 25 triệu', tags: ['Java', 'Spring Boot', 'MySQL'], deadline: new Date('2026-07-31'), status: 'active' },
      { enterpriseId: enterprises[0].id, title: 'Frontend Developer ReactJS', location: 'Hà Nội / Remote', salary: '12 - 20 triệu', tags: ['ReactJS', 'TypeScript', 'TailwindCSS'], deadline: new Date('2026-07-15'), status: 'active' },
      { enterpriseId: enterprises[1].id, title: 'Kỹ sư Phần mềm AI/ML', location: 'Hà Nội', salary: '20 - 35 triệu', tags: ['Python', 'AI', 'Machine Learning'], deadline: new Date('2026-08-01'), status: 'active' },
      { enterpriseId: enterprises[2].id, title: 'QA Engineer', location: 'TP. Hồ Chí Minh', salary: '10 - 18 triệu', tags: ['Testing', 'Automation', 'Selenium'], deadline: new Date('2026-06-30'), status: 'active' },
      { enterpriseId: enterprises[3].id, title: 'Chuyên viên Tài chính', location: 'Hà Nội', salary: '12 - 18 triệu', tags: ['Finance', 'Excel', 'ERP'], deadline: new Date('2026-07-20'), status: 'active' },
      { enterpriseId: enterprises[4].id, title: 'Kiểm toán viên (Audit Associate)', location: 'TP. Hồ Chí Minh', salary: '10 - 15 triệu', tags: ['Audit', 'Accounting', 'IFRS'], deadline: new Date('2026-08-15'), status: 'active' },
      { enterpriseId: enterprises[5].id, title: 'NodeJS Backend Developer', location: 'TP. Hồ Chí Minh', salary: '14 - 22 triệu', tags: ['NodeJS', 'NestJS', 'PostgreSQL'], deadline: new Date('2026-09-01'), status: 'active' },
      { enterpriseId: enterprises[1].id, title: 'Business Analyst', location: 'Hà Nội', salary: '15 - 25 triệu', tags: ['BA', 'BPMN', 'Agile'], deadline: new Date('2025-12-31'), status: 'closed' },
    ];
    const entities = data.map((d) => this.jobRepo.create(d as Partial<Job>));
    return this.jobRepo.save(entities);
  }

  // ─── JOB_FACULTIES ───────────────────────────────────────────
  private async seedJobFaculties(jobs: Job[], faculties: Faculty[]) {
    const pairs = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 1], [5, 1], [6, 0], [7, 2]];
    const data = pairs.map(([ji, fi]) =>
      this.jobFacultyRepo.create({ jobId: jobs[ji].id, facultyId: faculties[fi].id }),
    );
    return this.jobFacultyRepo.save(data);
  }

  // ─── SURVEYS ─────────────────────────────────────────────────
  private async seedSurveys(): Promise<Survey[]> {
    const data = [
      {
        title: 'Khảo sát việc làm sinh viên tốt nghiệp 2023',
        description: 'Khảo sát tình hình việc làm của sinh viên sau khi tốt nghiệp năm 2023',
        surveyType: 'employment',
        status: 'published',
      },
      {
        title: 'Khảo sát việc làm sinh viên tốt nghiệp 2024',
        description: 'Khảo sát tình hình việc làm của sinh viên sau khi tốt nghiệp năm 2024',
        surveyType: 'employment',
        status: 'published',
      },
      {
        title: 'Khảo sát cập nhật thông tin liên lạc cựu sinh viên',
        description: 'Thu thập thông tin liên lạc của cựu sinh viên để duy trì kết nối',
        surveyType: 'contact',
        status: 'draft',
      },
    ];
    const entities = data.map((d) => this.surveyRepo.create(d as Partial<Survey>));
    return this.surveyRepo.save(entities);
  }

  // ─── SURVEY SECTIONS ─────────────────────────────────────────
  private async seedSurveySections(surveys: Survey[]): Promise<SurveySection[]> {
    const data = [
      { surveyId: surveys[0].id, title: 'Thông tin cá nhân', orderIndex: 0 },
      { surveyId: surveys[0].id, title: 'Tình trạng việc làm', orderIndex: 1 },
      { surveyId: surveys[0].id, title: 'Đánh giá chương trình đào tạo', orderIndex: 2 },
      { surveyId: surveys[1].id, title: 'Thông tin cá nhân', orderIndex: 0 },
      { surveyId: surveys[1].id, title: 'Tình trạng việc làm', orderIndex: 1 },
    ];
    const entities = data.map((d) => this.sectionRepo.create(d as Partial<SurveySection>));
    return this.sectionRepo.save(entities);
  }

  // ─── SURVEY QUESTIONS ────────────────────────────────────────
  private async seedSurveyQuestions(surveys: Survey[], sections: SurveySection[]): Promise<SurveyQuestion[]> {
    const data = [
      // Survey 1 - Section 1
      { surveyId: surveys[0].id, sectionId: sections[0].id, questionKey: 'q_gender', questionText: 'Giới tính của bạn?', questionType: 'radio', options: [{ id: 'male', label: 'Nam' }, { id: 'female', label: 'Nữ' }], isRequired: 1, orderIndex: 0 },
      { surveyId: surveys[0].id, sectionId: sections[0].id, questionKey: 'q_major', questionText: 'Ngành học của bạn?', questionType: 'select', isRequired: 1, orderIndex: 1 },
      // Survey 1 - Section 2
      { surveyId: surveys[0].id, sectionId: sections[1].id, questionKey: 'q_employed', questionText: 'Sau khi tốt nghiệp, bạn có việc làm chưa?', questionType: 'radio', options: [{ id: 'yes', label: 'Có' }, { id: 'no', label: 'Chưa' }, { id: 'studying', label: 'Đang học tiếp' }], isRequired: 1, orderIndex: 0, showInChart: 1, chartType: 'pie', reportFieldKey: 'employment_status' },
      { surveyId: surveys[0].id, sectionId: sections[1].id, questionKey: 'q_salary', questionText: 'Mức lương hiện tại của bạn?', questionType: 'radio', options: [{ id: 'lt5', label: 'Dưới 5 triệu' }, { id: '5to10', label: '5 - 10 triệu' }, { id: '10to15', label: '10 - 15 triệu' }, { id: 'gt15', label: 'Trên 15 triệu' }], isRequired: 0, orderIndex: 1, showInChart: 1, chartType: 'column', reportFieldKey: 'salary_range' },
      { surveyId: surveys[0].id, sectionId: sections[1].id, questionKey: 'q_job_match', questionText: 'Công việc của bạn có đúng ngành không?', questionType: 'radio', options: [{ id: 'yes', label: 'Đúng ngành' }, { id: 'related', label: 'Liên quan' }, { id: 'no', label: 'Khác ngành' }], isRequired: 0, orderIndex: 2, showInChart: 1, chartType: 'pie' },
      // Survey 1 - Section 3
      { surveyId: surveys[0].id, sectionId: sections[2].id, questionKey: 'q_program_rating', questionText: 'Bạn đánh giá chương trình đào tạo như thế nào?', questionType: 'rating', isRequired: 0, orderIndex: 0 },
      { surveyId: surveys[0].id, sectionId: sections[2].id, questionKey: 'q_feedback', questionText: 'Góp ý của bạn để cải thiện chương trình đào tạo:', questionType: 'textarea', isRequired: 0, orderIndex: 1 },
      // Survey 2 - Section 4
      { surveyId: surveys[1].id, sectionId: sections[3].id, questionKey: 'q_gender', questionText: 'Giới tính của bạn?', questionType: 'radio', options: [{ id: 'male', label: 'Nam' }, { id: 'female', label: 'Nữ' }], isRequired: 1, orderIndex: 0 },
      { surveyId: surveys[1].id, sectionId: sections[4].id, questionKey: 'q_employed', questionText: 'Bạn có việc làm sau tốt nghiệp chưa?', questionType: 'radio', options: [{ id: 'yes', label: 'Có' }, { id: 'no', label: 'Chưa' }], isRequired: 1, orderIndex: 0, showInChart: 1, chartType: 'pie' },
    ];
    const entities = data.map((d) => this.questionRepo.create(d as Partial<SurveyQuestion>));
    return this.questionRepo.save(entities);
  }

  // ─── SURVEY_GRADUATIONS ──────────────────────────────────────
  private async seedSurveyGraduations(surveys: Survey[], graduations: Graduation[]) {
    const pairs = [[0, 0], [0, 1], [1, 2], [1, 3]];
    const data = pairs.map(([si, gi]) =>
      this.surveyGradRepo.create({ surveyId: surveys[si].id, graduationId: graduations[gi].id }),
    );
    return this.surveyGradRepo.save(data);
  }

  // ─── SURVEY RESPONSES ────────────────────────────────────────
  private async seedSurveyResponses(surveys: Survey[], students: Student[]): Promise<SurveyResponse[]> {
    const data: Partial<SurveyResponse>[] = [];
    for (let i = 0; i < 30; i++) {
      const student = students[i % students.length];
      data.push({
        surveyId: surveys[i % 2].id,
        studentId: student.id,
        status: 'submitted',
        snapshotInfo: {
          studentCode: student.code,
          studentName: student.fullName,
          email: student.email,
        },
        ipAddress: `192.168.1.${100 + i}`,
        submittedAt: new Date(2024, i % 12, (i % 28) + 1),
      });
    }
    const entities = data.map((d) => this.responseRepo.create(d as SurveyResponse));
    return this.responseRepo.save(entities);
  }

  // ─── SURVEY ANSWERS ──────────────────────────────────────────
  private async seedSurveyAnswers(responses: SurveyResponse[], questions: SurveyQuestion[]) {
    const employedOptions = ['yes', 'no', 'studying'];
    const salaryOptions = ['lt5', '5to10', '10to15', 'gt15'];
    const genderOptions = ['male', 'female'];
    const data: Partial<SurveyAnswer>[] = [];

    responses.slice(0, 20).forEach((r, i) => {
      // Filter questions by surveyId
      const qs = questions.filter((q) => q.surveyId === r.surveyId);
      qs.forEach((q) => {
        let answer: string | string[];
        if (q.questionKey === 'q_gender') answer = genderOptions[i % 2];
        else if (q.questionKey === 'q_employed') answer = employedOptions[i % 3];
        else if (q.questionKey === 'q_salary') answer = salaryOptions[i % 4];
        else if (q.questionKey === 'q_job_match') answer = ['yes', 'related', 'no'][i % 3];
        else if (q.questionKey === 'q_program_rating') answer = String((i % 5) + 1);
        else if (q.questionKey === 'q_feedback') answer = 'Chương trình học cần cập nhật thêm công nghệ mới.';
        else answer = 'N/A';
        data.push({ responseId: r.id, questionId: q.id, answer });
      });
    });

    const entities = data.map((d) => this.answerRepo.create(d as SurveyAnswer));
    return this.answerRepo.save(entities);
  }

  // ─── GROUP PERMISSIONS ───────────────────────────────────────
  private async seedGroupPermissions(): Promise<GroupPermission[]> {
    const data = [
      { name: 'Quản lý Sinh viên', code: 'student_management', orderIndex: 1 },
      { name: 'Quản lý Khảo sát', code: 'survey_management', orderIndex: 2 },
      { name: 'Quản lý Doanh nghiệp', code: 'enterprise_management', orderIndex: 3 },
      { name: 'Quản lý Hệ thống', code: 'system_management', orderIndex: 4 },
    ];
    const entities = data.map((d) => this.groupPermRepo.create(d));
    return this.groupPermRepo.save(entities);
  }

  // ─── PERMISSIONS ─────────────────────────────────────────────
  private async seedPermissions(groups: GroupPermission[]): Promise<Permission[]> {
    const [g1, g2, g3, g4] = groups;
    const data = [
      { name: 'Xem danh sách sinh viên', code: 'student.view', groupId: g1.id },
      { name: 'Tạo sinh viên', code: 'student.create', groupId: g1.id },
      { name: 'Chỉnh sửa sinh viên', code: 'student.edit', groupId: g1.id },
      { name: 'Xóa sinh viên', code: 'student.delete', groupId: g1.id },
      { name: 'Xem khảo sát', code: 'survey.view', groupId: g2.id },
      { name: 'Tạo khảo sát', code: 'survey.create', groupId: g2.id },
      { name: 'Chỉnh sửa khảo sát', code: 'survey.edit', groupId: g2.id },
      { name: 'Xuất báo cáo khảo sát', code: 'survey.export', groupId: g2.id },
      { name: 'Xem doanh nghiệp', code: 'enterprise.view', groupId: g3.id },
      { name: 'Tạo doanh nghiệp', code: 'enterprise.create', groupId: g3.id },
      { name: 'Quản lý người dùng', code: 'user.manage', groupId: g4.id },
      { name: 'Quản lý phân quyền', code: 'role.manage', groupId: g4.id },
    ];
    const entities = data.map((d) => this.permRepo.create(d));
    return this.permRepo.save(entities);
  }

  // ─── ROLES ───────────────────────────────────────────────────
  private async seedRoles(faculties: Faculty[]): Promise<Role[]> {
    const data = [
      { name: 'Quản trị hệ thống', facultyId: null },
      { name: 'Cán bộ Khoa CNTT', facultyId: faculties[0].id },
      { name: 'Cán bộ Khoa KTTC', facultyId: faculties[1].id },
      { name: 'Cán bộ Khoa QTKD', facultyId: faculties[2].id },
    ];
    const entities = data.map((d) => this.roleRepo.create(d as Partial<Role>));
    return this.roleRepo.save(entities);
  }

  // ─── ROLE_PERMISSIONS ────────────────────────────────────────
  private async seedRolePermissions(roles: Role[], perms: Permission[]) {
    const adminRole = roles[0];
    // Admin gets all permissions
    const adminData = perms.map((p) =>
      this.rolePermRepo.create({ roleId: adminRole.id, permissionId: p.id }),
    );
    // Faculty staff gets limited permissions
    const staffPerms = perms.filter((p) => ['student.view', 'survey.view', 'survey.export', 'enterprise.view'].includes(p.code));
    const staffData = roles.slice(1).flatMap((r) =>
      staffPerms.map((p) => this.rolePermRepo.create({ roleId: r.id, permissionId: p.id })),
    );
    return this.rolePermRepo.save([...adminData, ...staffData]);
  }

  // ─── USERS ───────────────────────────────────────────────────
  private async seedUsers(): Promise<User[]> {
    const data = [
      { ssoId: 'admin-001', fullName: 'Nguyễn Văn Admin', code: 'ADMIN001', status: 'active', type: 'admin' },
      { ssoId: 'officer-001', fullName: 'Trần Thị Lan', code: 'CB001', status: 'active', type: 'officer' },
      { ssoId: 'officer-002', fullName: 'Lê Văn Minh', code: 'CB002', status: 'active', type: 'officer' },
      { ssoId: 'officer-003', fullName: 'Phạm Thị Hoa', code: 'CB003', status: 'active', type: 'officer' },
      { ssoId: 'officer-004', fullName: 'Hoàng Văn Đức', code: 'CB004', status: 'inactive', type: 'officer' },
    ];
    const entities = data.map((d) => this.userRepo.create(d as Partial<User>));
    return this.userRepo.save(entities);
  }

  // ─── USER_ROLES ──────────────────────────────────────────────
  private async seedUserRoles(users: User[], roles: Role[]) {
    const data = [
      { userId: users[0].id, roleId: roles[0].id },
      { userId: users[1].id, roleId: roles[1].id },
      { userId: users[2].id, roleId: roles[2].id },
      { userId: users[3].id, roleId: roles[3].id },
      { userId: users[4].id, roleId: roles[1].id },
    ];
    const entities = data.map((d) => this.userRoleRepo.create(d as Partial<UserRole>));
    return this.userRoleRepo.save(entities);
  }

  // ─── STAT INDICATOR CONFIGS ──────────────────────────────────
  private async seedStatIndicatorConfigs() {
    const data = [
      { questionKey: 'employment_status', label: 'Tình trạng việc làm', showInChart: 1, chartType: 'pie', reportTemplate: 'mau01', excelColumn: 'C', orderIndex: 1 },
      { questionKey: 'salary_range', label: 'Mức lương', showInChart: 1, chartType: 'column', reportTemplate: 'mau01', excelColumn: 'D', orderIndex: 2 },
      { questionKey: 'job_match', label: 'Đúng ngành nghề', showInChart: 1, chartType: 'pie', reportTemplate: 'mau03', excelColumn: 'E', orderIndex: 3 },
      { questionKey: 'program_rating', label: 'Đánh giá chương trình', showInChart: 0, reportTemplate: 'mau01', excelColumn: 'F', orderIndex: 4 },
    ];
    const entities = data.map((d) => this.statConfigRepo.create(d as Partial<StatIndicatorConfig>));
    return this.statConfigRepo.save(entities);
  }
}