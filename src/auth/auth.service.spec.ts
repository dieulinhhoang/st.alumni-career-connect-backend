import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { RoleService } from 'src/role/role.service';
import { MailService } from 'src/mail/mail.service';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    sso_id: 'sso-001',
    fullName: 'Nguyễn Văn A',
    code: 'NV001',
    accessToken: 'tok',
    status: 'active',
    type: 'officer',
    isAdmin: false,
    facultyId: null,
    faculty: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userRoles: [],
    aiGenerations: [],
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let roleService: { buildPermissionsMap: jest.Mock };
  let httpService: { post: jest.Mock; get: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(),
      update: jest.fn(),
    };

    roleService = {
      buildPermissionsMap: jest.fn().mockResolvedValue(['students:read', 'surveys:read']),
    };

    httpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Enterprise), useValue: { findOneBy: jest.fn(), findOne: jest.fn() } },
        { provide: HttpService, useValue: httpService },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: RoleService, useValue: roleService },
        { provide: MailService, useValue: { sendEnterpriseInvite: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── getAccessToken ──────────────────────────────────────────────────────────

  describe('getAccessToken', () => {
    it('gọi SSO token endpoint và trả data', async () => {
      const fakeToken = { access_token: 'abc123' };
      httpService.post.mockReturnValue(of({ data: fakeToken }));

      const result = await service.getAccessToken('auth-code');

      expect(httpService.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fakeToken);
    });
  });

  // ─── getUserInfo ─────────────────────────────────────────────────────────────

  describe('getUserInfo', () => {
    it('gọi SSO userinfo endpoint với Bearer token', async () => {
      const fakeInfo = { id: 'sso-001', full_name: 'Nguyễn Văn A' };
      httpService.get.mockReturnValue(of({ data: fakeInfo }));

      const result = await service.getUserInfo('abc123');

      expect(httpService.get).toHaveBeenCalledTimes(1);
      const [, config] = httpService.get.mock.calls[0];
      expect(config.headers.Authorization).toBe('Bearer abc123');
      expect(result).toEqual(fakeInfo);
    });
  });

  // ─── findorCreateUser ────────────────────────────────────────────────────────

  describe('findorCreateUser', () => {
    const userInfo = { id: 'sso-001', full_name: 'Nguyễn Văn A', code: 'NV001' };

    it('cập nhật user hiện có nếu đã tồn tại', async () => {
      const existing = makeUser({ id: 5 });
      userRepo.findOne
        .mockResolvedValueOnce(existing)   // findOne by sso_id
        .mockResolvedValueOnce(makeUser({ id: 5, userRoles: [] })); // loadUserWithRoles

      await service.findorCreateUser(userInfo, 'new-token');

      expect(userRepo.update).toHaveBeenCalledWith(5, expect.objectContaining({ fullName: 'Nguyễn Văn A', accessToken: 'new-token' }));
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('tạo mới user nếu chưa có', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null)  // không tồn tại
        .mockResolvedValueOnce(makeUser({ id: 10, userRoles: [] })); // loadUserWithRoles
      userRepo.save.mockResolvedValue(makeUser({ id: 10 }));

      await service.findorCreateUser(userInfo, 'tok');

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('ném lỗi nếu user không tìm được sau khi upsert', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // loadUserWithRoles trả null
      userRepo.save.mockResolvedValue(makeUser({ id: 99 }));

      await expect(service.findorCreateUser(userInfo, 'tok')).rejects.toThrow('User not found after upsert');
    });
  });

  // ─── buildJwtPayload ─────────────────────────────────────────────────────────

  describe('buildJwtPayload', () => {
    it('admin: trả permissions là "*" và isAdmin = true', async () => {
      const adminUser = makeUser({
        id: 1,
        isAdmin: true,
        fullName: 'Super Admin',
        facultyId: null,
        userRoles: [{ roleId: 1, role: { name: 'admin', code: 'admin' } } as any],
      });

      const payload = await service.buildJwtPayload(adminUser);

      expect(payload.isAdmin).toBe(true);
      expect(payload.permissions).toBe('*');
      expect(payload.sub).toBe(1);
      expect(payload.roles).toContain('admin');
      expect(roleService.buildPermissionsMap).not.toHaveBeenCalled();
    });

    it('non-admin: gọi buildPermissionsMap và trả mảng permissions', async () => {
      const staffUser = makeUser({
        id: 2,
        isAdmin: false,
        fullName: 'Cán bộ A',
        facultyId: 3,
        userRoles: [{ roleId: 5, role: { name: 'staff', code: 'staff' } } as any],
      });

      const payload = await service.buildJwtPayload(staffUser);

      expect(payload.isAdmin).toBe(false);
      expect(Array.isArray(payload.permissions)).toBe(true);
      expect(payload.permissions).toContain('students:read');
      expect(roleService.buildPermissionsMap).toHaveBeenCalledWith([5]);
      expect(payload.facultyId).toBe(3);
    });

    it('user không có roles: permissions rỗng, roles rỗng', async () => {
      const bareUser = makeUser({ id: 3, isAdmin: false, userRoles: [] });
      roleService.buildPermissionsMap.mockResolvedValue([]);

      const payload = await service.buildJwtPayload(bareUser);

      expect(payload.roles).toHaveLength(0);
      expect(payload.permissions).toEqual([]);
      expect(roleService.buildPermissionsMap).toHaveBeenCalledWith([]);
    });
  });
});
