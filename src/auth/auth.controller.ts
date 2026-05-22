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
  ) {}

  @Get('sso/redirect')
  redirect(@Res() res: any) {
    const state = Math.random().toString(36).slice(2);

    const query = new URLSearchParams({
      client_id: process.env.SSO_CLIENT_ID || '',
      redirect_uri: process.env.SSO_REDIRECT_URI || '',
      response_type: 'code',
      scope: process.env.SSO_SCOPE || 'openid profile email',
      state,
      prompt: 'login',
    });

    return res.redirect(`${process.env.SSO_URL}?${query.toString()}`);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: any,
  ) {
    if (error) {
      return res.redirect(
        `${process.env.CLIENT_APP_URL}/auth/callback?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code) {
      return res.redirect(
        `${process.env.CLIENT_APP_URL}/auth/callback?error=${encodeURIComponent('missing_code')}`,
      );
    }

    try {
      const token = await this.authService.getAccessToken(code);

      if (!token?.access_token) {
        return res.redirect(
          `${process.env.CLIENT_APP_URL}/auth/callback?error=${encodeURIComponent('failed_to_get_access_token')}`,
        );
      }

      const userInfo = await this.authService.getUserInfo(token.access_token);

      if (!userInfo) {
        return res.redirect(
          `${process.env.CLIENT_APP_URL}/auth/callback?error=${encodeURIComponent('failed_to_get_user_info')}`,
        );
      }

      if (['normal', 'student'].includes(userInfo.role)) {
        return res.redirect(
          `${process.env.CLIENT_APP_URL}/auth/callback?error=${encodeURIComponent('access_denied')}`,
        );
      }

      const user = await this.authService.findorCreateUser(
        userInfo,
        token.access_token,
      );

      if (!user) {
        return res.redirect(
          `${process.env.CLIENT_APP_URL}/auth/callback?error=${encodeURIComponent('user_upsert_failed')}`,
        );
      }

      const appToken = this.jwtService.sign({
        sub: user.id,
        role: user.userRoles,
      });

      return res.redirect(
        `${process.env.CLIENT_APP_URL}/auth/callback?token=${encodeURIComponent(appToken)}`,
      );
    } catch (e) {
      return res.redirect(
        `${process.env.CLIENT_APP_URL}/auth/callback?error=${encodeURIComponent('sso_callback_failed')}`,
      );
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
}