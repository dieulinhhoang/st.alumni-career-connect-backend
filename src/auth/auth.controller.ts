import {
  Controller,
  Get,
  Post,
  Res,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) { }

  private getSafeReturnUrl(returnUrl?: string): string {
    if (!returnUrl) return '/';
    if (!returnUrl.startsWith('/')) return '/';
    if (returnUrl.startsWith('//')) return '/';
    return returnUrl;
  }

  private encodeState(returnUrl: string): string {
    const statePayload = {
      nonce: Math.random().toString(36).slice(2),
      returnUrl: this.getSafeReturnUrl(returnUrl),
    };

    return Buffer.from(JSON.stringify(statePayload)).toString('base64url');
  }

  private decodeState(state?: string): string {
    if (!state) return '/';

    try {
      const parsed = JSON.parse(
        Buffer.from(state, 'base64url').toString('utf-8'),
      );

      return this.getSafeReturnUrl(parsed?.returnUrl);
    } catch {
      return '/';
    }
  }

  private redirectToClient(
    res: any,
    params: {
      token?: string;
      error?: string;
      returnUrl?: string;
    },
  ) {
    const query = new URLSearchParams();

    if (params.token) {
      query.set('token', params.token);
    }

    if (params.error) {
      query.set('error', params.error);
    }

    query.set('returnUrl', this.getSafeReturnUrl(params.returnUrl));

    return res.redirect(
      `${process.env.CLIENT_APP_URL}/auth/callback?${query.toString()}`,
    );
  }

  @Get('sso/redirect')

  redirect(@Res() res: any) {
    const query = new URLSearchParams({
      client_id: process.env.SSO_CLIENT_ID || '',
      redirect_uri: process.env.SSO_REDIRECT_URI || '',
      response_type: 'code',
      scope: '',
    });

    return res.redirect(`${process.env.SSO_URL}/oauth/authorize?${query.toString()}`);
  }
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('state') state: string,
    @Res() res: any,
  ) {
    const returnUrl = this.decodeState(state);

    if (error) {
      return this.redirectToClient(res, {
        error,
        returnUrl,
      });
    }

    if (!code) {
      return this.redirectToClient(res, {
        error: 'missing_code',
        returnUrl,
      });
    }

    try {
      const token = await this.authService.getAccessToken(code);

      if (!token?.access_token) {
        return this.redirectToClient(res, {
          error: 'failed_to_get_access_token',
          returnUrl,
        });
      }

      const userInfo = await this.authService.getUserInfo(token.access_token);

      if (!userInfo) {
        return this.redirectToClient(res, {
          error: 'failed_to_get_user_info',
          returnUrl,
        });
      }

      if (['normal', 'student'].includes(userInfo.role)) {
        return this.redirectToClient(res, {
          error: 'access_denied',
          returnUrl,
        });
      }

      const user = await this.authService.findorCreateUser(
        userInfo,
        token.access_token,
      );

      // map userRoles -> mảng string rõ ràng
      const roles = Array.isArray(user.userRoles)
        ? user.userRoles
          .map((r: any) => r.role ?? r.name ?? r.code)
          .filter(Boolean)
        : [];

      const appToken = this.jwtService.sign({
        sub: user.id,
        roles,
      });

      return this.redirectToClient(res, {
        token: appToken,
        returnUrl,
      });
    } catch (e) {
      return this.redirectToClient(res, {
        error: 'sso_callback_failed',
        returnUrl,
      });
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: any) {
    return res.json({ message: 'Đăng xuất thành công' });
  }

  @Post('token')
  async proxyToken(@Body() body: any) {
    // Máy local nhận data từ Server, rồi tự tay gọi sang SSO hộ Server
    const params = new URLSearchParams(body);
    const { data } = await firstValueFrom(
      this.httpService.post('http://192.168.18.14:6891/oauth/token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
    return data; // Trả token về lại cho Server
  }

  @Post('userinfo')
  async proxyUserinfo(@Body() body: { url: string; token: string }) {
    // Làm hộ luôn cả bước lấy thông tin User (nếu bước này cũng bị firewall chặn)
    const { data } = await firstValueFrom(
      this.httpService.get(body.url, {
        headers: { Authorization: body.token },
      })
    );
    return data;
  }
}
