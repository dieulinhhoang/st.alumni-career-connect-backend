import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { RoleService } from 'src/role/role.service';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Enterprise) private enterpriseRepo: Repository<Enterprise>,
    private httpService: HttpService,
    private jwtService: JwtService,
    private roleService: RoleService,
    private mailService: MailService,
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
       if (user.status === 'inactive') {
      throw new BadRequestException('Tài khoản của bạn đã bị khóa');}
      await this.userRepo.update(user.id, payload);
    } 
    
    else {
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
      return { sub: user.id, isAdmin: true, roles, permissions: '*', name: user.fullName, facultyId: user.facultyId ?? null };
    }

    const roleIds = (user.userRoles ?? []).map((ur) => ur.roleId).filter(Boolean);
    const permissions = await this.roleService.buildPermissionsMap(roleIds);

    return { sub: user.id, isAdmin: false, roles, permissions, name: user.fullName, facultyId: user.facultyId ?? null };
  }

  //  ENTERPRISE AUTH 

  async sendEnterpriseInvite(enterpriseId: number) {
    const enterprise = await this.enterpriseRepo.findOneBy({ id: enterpriseId });
    if (!enterprise) throw new BadRequestException('Doanh nghiệp không tồn tại');
    if (!enterprise.email) throw new BadRequestException('Doanh nghiệp chưa có email');

    const existing = await this.userRepo.findOneBy({ enterpriseId });

    // Đã có tài khoản → gửi liên kết ĐẶT LẠI MẬT KHẨU thay vì báo lỗi
    if (existing) {
      const token = this.jwtService.sign(
        { enterpriseId, uid: existing.id, email: enterprise.email, type: 'enterprise_reset' },
        { expiresIn: '72h' },
      );
      const resetLink = `${process.env.CLIENT_APP_URL}/enterprise/accept-invite?token=${token}&mode=reset`;
      await this.mailService.sendEnterpriseResetPassword(enterprise.email, enterprise.name, resetLink);
      return { mode: 'reset', message: `Đã gửi liên kết đặt lại mật khẩu đến ${enterprise.email}` };
    }

    // Chưa có tài khoản → gửi lời mời kích hoạt (đặt mật khẩu lần đầu)
    const token = this.jwtService.sign(
      { enterpriseId, email: enterprise.email, type: 'enterprise_invite' },
      { expiresIn: '72h' },
    );

    const inviteLink = `${process.env.CLIENT_APP_URL}/enterprise/accept-invite?token=${token}`;
    await this.mailService.sendEnterpriseInvite(enterprise.email, enterprise.name, inviteLink);

    return { mode: 'invite', message: `Đã gửi lời mời đến ${enterprise.email}` };
  }

  async acceptEnterpriseInvite(token: string, password: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Liên kết không hợp lệ hoặc đã hết hạn');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Đặt lại mật khẩu cho tài khoản DN đã tồn tại
    if (payload.type === 'enterprise_reset') {
      const user = await this.userRepo.findOneBy({ enterpriseId: payload.enterpriseId, type: 'enterprise' });
      if (!user) throw new BadRequestException('Tài khoản doanh nghiệp không tồn tại');
      user.passwordHash = passwordHash;
      await this.userRepo.save(user);
      return { message: 'Đặt lại mật khẩu thành công' };
    }

    if (payload.type !== 'enterprise_invite') throw new BadRequestException('Token không hợp lệ');

    const existing = await this.userRepo.findOneBy({ enterpriseId: payload.enterpriseId });
    if (existing) throw new BadRequestException('Tài khoản đã được kích hoạt trước đó');

    const enterprise = await this.enterpriseRepo.findOneBy({ id: payload.enterpriseId });

    const user = this.userRepo.create({
      sso_id: `enterprise_${payload.enterpriseId}`,
      email: payload.email,
      passwordHash,
      enterpriseId: payload.enterpriseId,
      fullName: enterprise?.name ?? 'Doanh nghiệp',
      type: 'enterprise',
      status: 'active',
    });

    await this.userRepo.save(user);
    return { message: 'Tài khoản đã được kích hoạt thành công' };
  }

  async enterpriseLogin(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email, type: 'enterprise' },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user || !user.passwordHash) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const jwtPayload = {
      sub: user.id,
      type: 'enterprise',
      enterpriseId: user.enterpriseId,
      name: user.fullName,
      isAdmin: false,
      permissions: {},
    };

    return { accessToken: this.jwtService.sign(jwtPayload) };
  }
}