import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RoleService } from 'src/role/role.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private httpService: HttpService,
    private roleService: RoleService,
  ) {}

  async getAccessToken(code: string): Promise<any> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SSO_CLIENT_ID || '',
      client_secret: process.env.SSO_CLIENT_SECRET || '',
      redirect_uri: process.env.SSO_REDIRECT_URI || '',
      code,
    });
    const { data } = await firstValueFrom(
      this.httpService.post(process.env.SSO_TOKEN_URL || '', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    return data;
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get(process.env.SSO_USERINFO_URL || '', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return data;
  }

  private async loadUserWithRoles(userId: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) throw new Error('User not found after upsert');
    return user;
  }

  async findorCreateUser(userInfo: any, accessToken: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { sso_id: userInfo.id } });

    const payload: Partial<User> = {
      fullName: userInfo.full_name,
      code: userInfo.code ?? null,
      accessToken,
    };

    if (user) {
      await this.userRepo.update(user.id, payload);
    } else {
      user = await this.userRepo.save(
        this.userRepo.create({ sso_id: userInfo.id, ...payload }),
      );
    }

    return this.loadUserWithRoles(user.id);
  }

  async buildJwtPayload(user: User) {
    const roles = (user.userRoles ?? [])
      .map((ur) => ur.role?.name ?? ur.role?.code)
      .filter(Boolean);

    if (user.isAdmin) {
      // Admin: wildcard dạng ["*"] để frontend havePermission('*') match
      return { sub: user.id, isAdmin: true, roles, permissions: ['*'], name: user.fullName, facultyId: user.facultyId ?? null };
    }

    const roleIds = (user.userRoles ?? []).map((ur) => ur.roleId).filter(Boolean);
    
    const permissions = await this.roleService.buildPermissionsMap(roleIds);

    return { sub: user.id, isAdmin: false, roles, permissions, name: user.fullName, facultyId: user.facultyId ?? null };
  }
}