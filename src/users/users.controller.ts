import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { RequirePermission } from 'src/auth/decorators/require-permission.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermission('user:create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermission('user:read')
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('user:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('user:update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermission('user:delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Patch(':id/suspend')
  @RequirePermission('user:update')
  suspend(@Param('id') id: string) {
    return this.usersService.suspend(+id);
  }

  //  Gán role cho user 

  /**
   * GET /users/:id/roles
   * Trả về danh sách role đang được gán cho user.
   */
  @Get(':id/roles')
  @RequirePermission('user:read')
  getUserRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(+id);
  }

  /**
   * POST /users/:id/roles
   * Gán (thay thế toàn bộ) roles cho user.
   * Body: { roleIds: [1, 2, 3] }
   */
  @Post(':id/roles')
  @RequirePermission('user:update')
  assignRoles(
    @Param('id') id: string,
    @Body('roleIds') roleIds: number[],
  ) {
    return this.usersService.assignRoles(+id, roleIds);
  }
}