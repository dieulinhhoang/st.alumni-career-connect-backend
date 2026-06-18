import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { Resource } from 'src/database/entities/resources.entity';

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 1,
    name: 'Sinh viên',
    code: 'students',
    actions: ['read', 'create', 'update', 'delete'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  } as unknown as Resource;
}

function createQbMock(items: any[], total = items.length) {
  const qb: any = {};
  ['andWhere', 'orderBy', 'skip', 'take'].forEach(
    (m) => { qb[m] = jest.fn().mockReturnValue(qb); },
  );
  qb.getManyAndCount = jest.fn().mockResolvedValue([items, total]);
  return qb;
}

describe('ResourcesService', () => {
  let service: ResourcesService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn((v) => v),
      save: jest.fn(),
      findOneBy: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: getRepositoryToken(Resource), useValue: repo },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  //  create 

  describe('create', () => {
    it('tạo resource và trả data đã chuẩn hoá', async () => {
      const dto = { name: ' Sinh viên ', code: ' students ', actions: [' read ', ' create '] };
      const saved = makeResource();
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith({
        name: 'Sinh viên',
        code: 'students',
        actions: ['read', 'create'],
      });
      expect(result.message).toBe('Tạo tài nguyên thành công');
      expect(result.data.code).toBe('students');
    });

    it('lọc bỏ action rỗng', async () => {
      repo.save.mockResolvedValue(makeResource({ actions: ['read'] }));

      await service.create({ name: 'R', code: 'r', actions: ['read', '', '  '] });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actions: ['read'] }),
      );
    });

    it('actions mặc định là [] nếu không truyền vào', async () => {
      repo.save.mockResolvedValue(makeResource({ actions: [] }));

      await service.create({ name: 'R', code: 'r', actions: undefined as any });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actions: [] }),
      );
    });
  });

  //  findAll 

  describe('findAll', () => {
    it('trả danh sách và metadata phân trang', async () => {
      const resources = [makeResource(), makeResource({ id: 2, code: 'surveys' })];
      repo.createQueryBuilder.mockReturnValue(createQbMock(resources, 2));

      const result = await service.findAll({});

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.page.current_page).toBe(1);
      expect(result.page.total_pages).toBe(1);
    });

    it('cấu trúc normalizeResource: _id là string, actions là array', async () => {
      repo.createQueryBuilder.mockReturnValue(createQbMock([makeResource()]));

      const result = await service.findAll({});
      const item = result.data[0];

      expect(typeof item._id).toBe('string');
      expect(item._id).toBe('1');
      expect(Array.isArray(item.actions)).toBe(true);
    });

    it('has_next và has_previous đúng khi có nhiều trang', async () => {
      repo.createQueryBuilder.mockReturnValue(createQbMock([makeResource()], 15));

      const result = await service.findAll({ page: 1, size: 5 });

      expect(result.page.has_next).toBe(true);
      expect(result.page.has_previous).toBe(true);
    });
  });

  //  findOne 

  describe('findOne', () => {
    it('trả data khi tìm thấy', async () => {
      repo.findOneBy.mockResolvedValue(makeResource());

      const result = await service.findOne(1);
      expect(result.data.code).toBe('students');
    });

    it('ném NotFoundException khi không tìm thấy', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  //  update 

  describe('update', () => {
    it('cập nhật name, code, actions và trả data', async () => {
      const existing = makeResource();
      repo.findOneBy.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, name: 'Cập nhật', code: 'updated' });

      const result = await service.update(1, {
        name: 'Cập nhật',
        code: 'updated',
        actions: ['read'],
      });

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result.message).toBe('Cập nhật tài nguyên thành công');
    });

    it('ném NotFoundException khi resource không tồn tại', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update(99, {})).rejects.toThrow(NotFoundException);
    });

    it('giữ nguyên giá trị cũ khi trường update là chuỗi rỗng', async () => {
      const existing = makeResource({ name: 'Sinh viên', code: 'students' });
      repo.findOneBy.mockResolvedValue(existing);
      repo.save.mockImplementation((r) => Promise.resolve(r));

      await service.update(1, { name: '' });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Sinh viên' }),
      );
    });
  });

  //  remove 

  describe('remove', () => {
    it('xóa resource và trả thông báo', async () => {
      repo.findOneBy.mockResolvedValue(makeResource());
      repo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);

      expect(repo.delete).toHaveBeenCalledWith({ id: 1 });
      expect(result.message).toBe('Xoá tài nguyên thành công');
    });

    it('ném NotFoundException khi resource không tồn tại', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
