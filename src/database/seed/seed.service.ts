import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Major } from '../major.entity';
import { User } from '../user.entity';
import { Role } from '../role.entity';
import { Permission } from '../permission.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Major) private majorRepo: Repository<Major>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
  ) {}

  async onModuleInit() {
    this.logger.log(' Bắt đầu quá trình Seed dữ liệu...');
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedMajors();
    await this.seedAdminUser();
    this.logger.log(' Hoàn thành Seed dữ liệu!');
  }

  private async seedPermissions() {
    const count = await this.permRepo.count();
    if (count > 0) return;

    const permissions = [
      { name: 'Xem khảo sát', code: 'survey.view', group: 'survey' },
      { name: 'Tạo khảo sát', code: 'survey.create', group: 'survey' },
      { name: 'Quản lý người dùng', code: 'user.manage', group: 'user' },
    ];
    await this.permRepo.save(permissions);
    this.logger.log(' - Đã tạo danh sách Quyền (Permissions)');
  }

  private async seedRoles() {
    const count = await this.roleRepo.count();
    if (count > 0) return;

    const roles = [
      { name: 'Quản trị viên', description: 'Toàn quyền hệ thống' },
      { name: 'Chuyên viên', description: 'Quản lý khảo sát' },
      { name: 'Giảng viên', description: 'Xem báo cáo' },
    ];
    await this.roleRepo.save(roles);
    this.logger.log(' - Đã tạo danh sách Vai trò (Roles)');
  }

  private async seedMajors() {
    const count = await this.majorRepo.count();
    if (count > 0) return;

    const majors = [
      { code: 'CNTT', name: 'Công nghệ thông tin' },
      { code: 'TY', name: 'Thú y' },
      { code: 'KT', name: 'Kế toán' },
      { code: 'KHMT', name: 'Khoa học máy tính' },
    ];
    await this.majorRepo.save(majors);
    this.logger.log(' - Đã tạo danh sách Ngành học (Majors)');
  }

  private async seedAdminUser() {
    const adminExists = await this.userRepo.findOne({ where: { sso_id: 'admin' } });
    if (adminExists) return;

    const admin = this.userRepo.create({
      sso_id: 'admin',
      full_name: 'System Admin',
      type: 'officer',
      status: 'active',
    });
    await this.userRepo.save(admin);
    this.logger.log(' - Đã tạo tài khoản Admin mặc định');
  }
}