import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private httpService: HttpService,
  ) {}

 async getAccessToken(code: string): Promise<any> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.SSO_CLIENT_ID || '',
    client_secret: process.env.SSO_CLIENT_SECRET || '',
    redirect_uri: process.env.SSO_REDIRECT_URI || '',
    code,
  });

  console.log('SSO_TOKEN_URL:', process.env.SSO_TOKEN_URL);
  console.log('SSO_REDIRECT_URI:', process.env.SSO_REDIRECT_URI);
  console.log('SSO code:', code);

  const { data } = await firstValueFrom(
    this.httpService.post(process.env.SSO_TOKEN_URL || '', body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
  );

  console.log('token response:', data);
  return data;
}

async getUserInfo(accessToken: string): Promise<any> {
  console.log('SSO_USERINFO_URL:', process.env.SSO_USERINFO_URL);

  const { data } = await firstValueFrom(
    this.httpService.get(process.env.SSO_USERINFO_URL || '', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );

  console.log('userinfo response:', data);
  return data;
}
 

  async findorCreateUser(userInfo: any, accessToken: string): Promise<User> {
    let user = await this.userRepo.findOne({
      where: { sso_id: userInfo.id },
      relations: ['userRoles'],
    });

    const payload: Partial<User> = {
      fullName: userInfo.full_name,
      code: userInfo.code ?? null,
      accessToken,
    };

    if (user) {
      await this.userRepo.update(user.id, payload);

      user = await this.userRepo.findOne({
        where: { id: user.id },
        relations: ['userRoles'],
      });
    } else {
      user = await this.userRepo.save(
        this.userRepo.create({
          sso_id: userInfo.id,
          ...payload,
        }),
      );

      user = await this.userRepo.findOne({
        where: { id: user.id },
        relations: ['userRoles'],
      });
    }

    if (!user) {
      throw new Error('User upsert failed');
    }

    return user;
  }
}