import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { RequirePermission } from 'src/auth/decorators/require-permission.decorator';

@Controller('role')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  //  CRUD Role 

  @Post()
  @RequirePermission('role:create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @RequirePermission('role:read')
  findAll(@Query() query: any) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('role:read')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(+id);
  }

  @Put(':id')
  @RequirePermission('role:update')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermission('role:delete')
  remove(@Param('id') id: string) {
    return this.roleService.remove(+id);
  }

  //  Phân quyền: gán resource/actions cho role 

  /**
   * GET /role/:id/resources
   * Trả về danh sách tất cả resources, kèm actions nào đã được cấp cho role này.
   *
   * Response:
   * [
   *   {
   *     id: 1, name: "Quản lý cựu sinh viên", code: "alumni",
   *     actions: [
   *       { action: "read",   isGranted: true  },
   *       { action: "create", isGranted: false },
   *       ...
   *     ]
   *   }, ...
   * ]
   */
  @Get(':id/resources')
  @RequirePermission('role:read')
  getRoleResources(@Param('id') id: string) {
    return this.roleService.getRoleResources(+id);
  }

  /**
   * POST /role/:id/resources
   * Gán (thay thế toàn bộ) resource+actions cho role.
   *
   * Body:
   * {
   *   assignments: [
   *     { resourceId: 1, actions: ["read", "create"] },
   *     { resourceId: 2, actions: ["read"] }
   *   ]
   * }
   */
  @Post(':id/resources')
  @RequirePermission('role:update')
  assignResources(
    @Param('id') id: string,
    @Body('assignments')
    assignments: { resourceId: number; actions: string[] }[],
  ) {
    return this.roleService.assignResources(+id, assignments);
  }
}