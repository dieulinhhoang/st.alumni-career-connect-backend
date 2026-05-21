import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Redirect, Query, UseGuards, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor( 
    private authService: AuthService,
    private jwtService: JwtService
  ) {}

  // redircet to login  sso
  @Get('sso/redirect')
  redirect(@Res() res: any) {  // res ép return trả về đúng cái cần
  //    console.log('SSO_REDIRECT_URI:', process.env.SSO_REDIRECT_URI);  
  // console.log('SSO_URL:', process.env.SSO_URL);
    const query = new URLSearchParams({
      client_id: process.env.SSO_CLIENT_ID || '',
      redirect_uri: process.env.SSO_REDIRECT_URI || '',
      response_type: 'code',
      scope: '',
    });
    res.redirect(`${process.env.SSO_URL}?${query}`);

  }
  
  // callback sso 
  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: any) {
    const token = await this.authService.getAccessToken(code); 
    if(!token) {
      return res.status(400).json({ message: 'Failed to get access token' });
    }
    const userInfo = await this.authService.getUserInfo(token.access_token);

    // ko phai role admin va teacher thi ko dc vao
    if(['normal', 'student'].includes(userInfo.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    //upsert user vao db
    const user = await this.authService.findorCreateUser(userInfo ,token.access_token);

    // tao jwt token
    const appToken = this.jwtService.sign({ sub: user.id, role: user.userRoles });

    // return jwt token cho client
    return res.redirect(`${process.env.CLIENT_APP_URL}?token=${appToken}`);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)  //@Req() (Request - Nhận vào): Là toàn bộ dữ liệu khách hàng gửi lên server (như điền form, gửi token, thông tin trình duyệt)
  async getProfile(@Req() req: any) {
    return req.user; // req.user đã được JwtAuthGuard gán thông tin user sau khi xác thực token
  }
   

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: any) {
    // logic để logout
    return res.json({ message: 'Đăng xuất thành công' });
  }
}
