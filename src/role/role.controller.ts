import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.roleService.findAll(query);
  }

  @Get('permissions/all')
  getAllPermissions() {
    return this.roleService.getAllPermissions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(+id);
  }

  @Get(':id/permissions')
  getRolePermissions(@Param('id') id: string) {
    return this.roleService.getRolePermissions(+id);
  }

  @Post(':id/permissions')
  assignPermissions(
    @Param('id') id: string,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return this.roleService.assignPermissions(+id, permissionIds);
  }
}
