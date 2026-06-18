import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

function makeRes() {
  return {
    redirect: jest.fn(),
    json: jest.fn(),
  };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    getAccessToken: jest.Mock;
    getUserInfo: jest.Mock;
    findorCreateUser: jest.Mock;
    buildJwtPayload: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    authService = {
      getAccessToken: jest.fn(),
      getUserInfo: jest.fn(),
      findorCreateUser: jest.fn(),
      buildJwtPayload: jest.fn(),
    };

    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  //  getSafeReturnUrl (via callback) 

  describe('getSafeReturnUrl (private, tested indirectly)', () => {
    it('trả "/" khi returnUrl undefined', async () => {
      authService.getAccessToken.mockResolvedValue({ access_token: 't' });
      authService.getUserInfo.mockResolvedValue({ id: 'u1', role: 'staff', full_name: 'A' });
      authService.findorCreateUser.mockResolvedValue({ id: 1, isAdmin: true, userRoles: [] });
      authService.buildJwtPayload.mockResolvedValue({ sub: 1 });
      const res = makeRes();

      // state = undefined → returnUrl sẽ là '/'
      await controller.callback('code', '', undefined as any, res as any);

      const call = res.redirect.mock.calls[0][0] as string;
      expect(call).toContain('returnUrl=%2F');
    });
  });

  //  callback 

  describe('callback', () => {
    it('redirect với error khi SSO trả lỗi', async () => {
      const res = makeRes();

      await controller.callback('', 'access_denied', '', res as any);

      expect(res.redirect).toHaveBeenCalledTimes(1);
      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('error=access_denied');
    });

    it('redirect với missing_code khi không có code', async () => {
      const res = makeRes();

      await controller.callback('', '', '', res as any);

      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('error=missing_code');
    });

    it('redirect với failed_to_get_access_token khi SSO không trả token', async () => {
      authService.getAccessToken.mockResolvedValue({});
      const res = makeRes();

      await controller.callback('my-code', '', '', res as any);

      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('error=failed_to_get_access_token');
    });

    it('redirect với failed_to_get_user_info khi SSO không trả userInfo', async () => {
      authService.getAccessToken.mockResolvedValue({ access_token: 'tok' });
      authService.getUserInfo.mockResolvedValue(null);
      const res = makeRes();

      await controller.callback('my-code', '', '', res as any);

      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('error=failed_to_get_user_info');
    });

    it('redirect với access_denied khi role là "normal"', async () => {
      authService.getAccessToken.mockResolvedValue({ access_token: 'tok' });
      authService.getUserInfo.mockResolvedValue({ id: 'u1', role: 'normal', full_name: 'SV A' });
      const res = makeRes();

      await controller.callback('my-code', '', '', res as any);

      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('error=access_denied');
    });

    it('redirect với access_denied khi role là "student"', async () => {
      authService.getAccessToken.mockResolvedValue({ access_token: 'tok' });
      authService.getUserInfo.mockResolvedValue({ id: 'u1', role: 'student', full_name: 'SV B' });
      const res = makeRes();

      await controller.callback('my-code', '', '', res as any);

      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('error=access_denied');
    });

    it('thành công: redirect với token hợp lệ', async () => {
      authService.getAccessToken.mockResolvedValue({ access_token: 'sso-tok' });
      authService.getUserInfo.mockResolvedValue({ id: 'u1', role: 'officer', full_name: 'Cán Bộ' });
      authService.findorCreateUser.mockResolvedValue({ id: 1, isAdmin: false, userRoles: [] });
      authService.buildJwtPayload.mockResolvedValue({ sub: 1, isAdmin: false, permissions: [] });
      const res = makeRes();

      await controller.callback('my-code', '', '', res as any);

      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('token=signed.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('redirect với sso_callback_failed khi xảy ra exception', async () => {
      authService.getAccessToken.mockRejectedValue(new Error('network error'));
      const res = makeRes();

      await controller.callback('my-code', '', '', res as any);

      const url: string = res.redirect.mock.calls[0][0];
      expect(url).toContain('error=sso_callback_failed');
    });
  });

  //  getProfile 

  describe('getProfile', () => {
    it('trả req.user', async () => {
      const fakeUser = { sub: 1, name: 'Admin' };
      const result = await controller.getProfile({ user: fakeUser } as any);
      expect(result).toEqual(fakeUser);
    });
  });

  //  logout 

  describe('logout', () => {
    it('trả JSON thành công', async () => {
      const res = makeRes();
      await controller.logout(res as any);
      expect(res.json).toHaveBeenCalledWith({ message: 'Đăng xuất thành công' });
    });
  });
});
