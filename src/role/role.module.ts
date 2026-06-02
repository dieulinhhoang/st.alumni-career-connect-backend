import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { Role } from 'src/database/entities/role.entity';
import { Permission } from 'src/database/entities/permission.entity';
import { RolePermission } from 'src/database/entities/role-permission.entity';
import { GroupPermission } from 'src/database/entities/group-permission.entity';
import { UserRole } from 'src/database/entities/user-role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [RoleController],
  providers: [RoleService],
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      GroupPermission,
      UserRole,
    ]),
  ],
  exports: [RoleService],
})
export class RoleModule {}
