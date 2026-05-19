import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/user.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private httpService: HttpService,
  ) {}

  async getAccessToken(code: string): Promise<any> { //firstValueFrom lấy ra giá trị đầu tiên mà Observable phát ra
    const { data } = await firstValueFrom(
      this.httpService.post<any>(`${process.env.SSO_TOKEN_URL}`, new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SSO_CLIENT_ID || '',
        client_secret: process.env.SSO_CLIENT_SECRET || '',
        code: code,
      }))
    );
    return data;
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get<any>(`${process.env.SSO_USERINFO_URL}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    );
    return data;
  }

  async findorCreateUser(userInfo: any, accessToken: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { sso_id: userInfo.id } });
      const payload = {
      fullName:    userInfo.full_name,
      email:       userInfo.email,
      code:        userInfo.code ?? null,
      facultyId:   userInfo.role !== 'superAdmin' ? userInfo.faculty_id : null,
      role:        userInfo.role,
      accessToken, // SSO token — dùng để gọi /api/verify sau này
      userData:    userInfo,
    };

    if (user) {
      await this.userRepo.update(user.id, payload);
    } else {
      user = await this.userRepo.save(this.userRepo.create({ sso_id: userInfo.id, ...payload }));
    }
    return user;
  }


}
