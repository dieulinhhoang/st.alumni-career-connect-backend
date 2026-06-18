import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { Student } from 'src/database/entities/student.entity';

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 1,
    code: '6665591',
    fullName: 'Nguyễn Văn A',
    gender: 'male',
    trainingIndustryId: 11,
    citizenIdentification: '079200000001',
    major: null,
    ...overrides,
  } as unknown as Student;
}

function createQbMock(result: any[], count = result.length) {
  const qb: any = {};
  ['leftJoinAndSelect', 'orderBy', 'skip', 'take', 'andWhere'].forEach(
    (m) => { qb[m] = jest.fn().mockReturnValue(qb); },
  );
  qb.getManyAndCount = jest.fn().mockResolvedValue([result, count]);
  return qb;
}

describe('StudentsService', () => {
  let service: StudentsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn((v) => v),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(Student), useValue: repo },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  //  create 

  describe('create', () => {
    it('tạo và lưu sinh viên mới', async () => {
      const dto = { code: '123', fullName: 'SV Mới' } as any;
      const saved = makeStudent({ code: '123', fullName: 'SV Mới' });
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(saved);
    });
  });

  //  findAll 

  describe('findAll', () => {
    it('trả danh sách phân trang mặc định', async () => {
      const students = [makeStudent(), makeStudent({ id: 2, code: '222' })];
      repo.createQueryBuilder.mockReturnValue(createQbMock(students, 2));

      const result = await service.findAll({});

      expect(result.total).toBe(2);
      expect(result.page).toBe(0);
      expect(result.size).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('admin xem tất cả, không lọc theo facultyId', async () => {
      const qb = createQbMock([makeStudent()]);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({}, { isAdmin: true, facultyId: null });

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('non-admin có facultyId sẽ lọc theo khoa', async () => {
      const qb = createQbMock([makeStudent()]);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({}, { isAdmin: false, facultyId: 3 });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'major.faculty_id = :facultyId',
        { facultyId: 3 },
      );
    });

    it('phân trang đúng theo page/size', async () => {
      const qb = createQbMock([], 50);
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 2, size: 5 });

      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result.totalPages).toBe(10);
    });
  });

  //  findOne 

  describe('findOne', () => {
    it('trả sinh viên khi tìm thấy', async () => {
      const student = makeStudent();
      repo.findOne.mockResolvedValue(student);

      const result = await service.findOne(1);
      expect(result).toEqual(student);
    });

    it('ném NotFoundException khi không tìm thấy', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  //  update 

  describe('update', () => {
    it('cập nhật và trả sinh viên mới', async () => {
      const existing = makeStudent();
      const updated = makeStudent({ fullName: 'Đã cập nhật' });
      repo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, { fullName: 'Đã cập nhật' } as any);

      expect(repo.update).toHaveBeenCalledWith({ id: 1 }, { fullName: 'Đã cập nhật' });
      expect(result).toEqual(updated);
    });

    it('ném NotFoundException khi sinh viên không tồn tại', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update(99, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  //  remove 

  describe('remove', () => {
    it('gọi softDelete khi sinh viên tồn tại', async () => {
      repo.findOne.mockResolvedValue(makeStudent());
      repo.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(repo.softDelete).toHaveBeenCalledWith({ id: 1 });
    });

    it('ném NotFoundException khi sinh viên không tồn tại', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
