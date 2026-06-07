import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { Role } from 'src/database/entities/role.entity';
import { Resource } from 'src/database/entities/resources.entity';
import { RoleResource } from 'src/database/entities/role-resource.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [RoleController],
  providers: [RoleService],
  imports: [TypeOrmModule.forFeature([Role, Resource, RoleResource])],
  exports: [RoleService],
})
export class RoleModule {}