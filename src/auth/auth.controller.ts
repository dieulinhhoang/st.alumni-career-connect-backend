import {
  Body,
  Controller,
  Get,
  Param,
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
      return this.redirectToClient(res, { error, returnUrl });
    }

    if (!code) {
      return this.redirectToClient(res, { error: 'missing_code', returnUrl });
    }

    try {
      // console.log('[SSO] Getting access token...');
      const token = await this.authService.getAccessToken(code);
      // console.log('[SSO] getAccessToken result:', token?.access_token ? 'OK' : 'EMPTY');

      if (!token?.access_token) {
        return this.redirectToClient(res, { error: 'failed_to_get_access_token', returnUrl });
      }

      // console.log('[SSO] Getting user info...');
      const userInfo = await this.authService.getUserInfo(token.access_token);
      // console.log('[SSO] userInfo:', JSON.stringify(userInfo));

      if (!userInfo) {
        return this.redirectToClient(res, { error: 'failed_to_get_user_info', returnUrl });
      }

      if (['normal', 'student'].includes(userInfo.role)) {
        // console.log('[SSO] Access denied for role:', userInfo.role);
        return this.redirectToClient(res, { error: 'access_denied', returnUrl });
      }

      // console.log('[SSO] Finding/creating user...');
      const user = await this.authService.findorCreateUser(userInfo, token.access_token);
      // console.log('[SSO] User id:', user?.id, 'isAdmin:', user?.isAdmin);

      // console.log('[SSO] Building JWT payload...');
      const jwtPayload = await this.authService.buildJwtPayload(user);
      // console.log('[SSO] JWT payload:', JSON.stringify(jwtPayload));

      const appToken = this.jwtService.sign(jwtPayload);
      // console.log('[SSO] Token signed, length:', appToken?.length);

      return this.redirectToClient(res, { token: appToken, returnUrl });
    } catch (e: any) {
      console.error('[SSO callback error]', e?.message, e?.stack);
      return this.redirectToClient(res, { error: 'sso_callback_failed', returnUrl });
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

  //  ENTERPRISE AUTH 

  @Post('enterprise/invite/:enterpriseId')
  @UseGuards(JwtAuthGuard)
  sendEnterpriseInvite(@Param('enterpriseId') enterpriseId: string) {
    return this.authService.sendEnterpriseInvite(+enterpriseId);
  }

  @Post('enterprise/accept-invite')
  acceptEnterpriseInvite(@Body() body: { token: string; password: string }) {
    return this.authService.acceptEnterpriseInvite(body.token, body.password);
  }

  @Post('enterprise/login')
  enterpriseLogin(@Body() body: { email: string; password: string }) {
    return this.authService.enterpriseLogin(body.email, body.password);
  }
}