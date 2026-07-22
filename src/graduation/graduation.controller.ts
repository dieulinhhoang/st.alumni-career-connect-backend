import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { CreateGraduationDto } from './dto/create-graduation.dto';
import { UpdateGraduationDto } from './dto/update-graduation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller()
@UseGuards(JwtAuthGuard)
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) { }

  // POST /graduation
  @Post('graduation')
  create(@Body() createGraduationDto: CreateGraduationDto) {
    return this.graduationService.create(createGraduationDto);
  }

  // ─── Đồng bộ từ hệ thống ST Student ───────────────────────────────
  // Dùng SSO token của cán bộ đang đăng nhập (user.id) để xác thực với ST Student.

  // POST /graduation/sync — đồng bộ danh sách đợt tốt nghiệp
  @Post('graduation/sync')
  syncGraduations(@CurrentUser() user: { id: number }) {
    return this.graduationService.syncGraduationsForUser(user.id);
  }

  // POST /graduation/sync-all — đồng bộ đợt tốt nghiệp + sinh viên từng đợt
  @Post('graduation/sync-all')
  syncAll(@CurrentUser() user: { id: number }) {
    return this.graduationService.syncAllFromStudentSystem(user.id);
  }

  // POST /graduation/:id/sync-students — đồng bộ sinh viên của 1 đợt
  @Post('graduation/:id/sync-students')
  syncStudents(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return this.graduationService.syncGraduationStudentsForUser(+id, user.id);
  }

  @Post('graduation/verify-student')
  @Public()
  verifyStudent(
    @Body() body: { graduationId: number; fullName?: string; dob?: string; phone?: string; studentCode?: string },
  ) {
    return this.graduationService.findStudentByFields(body.graduationId, body);
  }

  // GET /graduation?page=1&per_page=10
  @Get('graduation')
  findAll(@Query() query: any) {
    const page = Number(query.page ?? 1);
    const perPage = Number(query.per_page ?? 10);
    return this.graduationService.findAllPaginated(page, perPage, query);
  }

  // GET /graduation/:id
  @Get('graduation/:id')
  findOne(@Param('id') id: string) {
    return this.graduationService.findOne(+id);
  }

  // PATCH /graduation/:id
  @Patch('graduation/:id')
  update(@Param('id') id: string, @Body() updateGraduationDto: UpdateGraduationDto) {
    return this.graduationService.update(+id, updateGraduationDto);
  }

  // DELETE /graduation/:id
  @Delete('graduation/:id')
  remove(@Param('id') id: string) {
    return this.graduationService.remove(+id);
  }

  // GET /graduation/:id/faculty-breakdown
  @Get('graduation/:id/faculty-breakdown')
  getFacultyBreakdown(@Param('id') id: string) {
    return this.graduationService.getFacultyBreakdown(+id);
  }

  // GET /grad-students?graduation_id=1&page=1&per_page=10
  @Get('grad-students')
  @Public()
  getStudents(@Query() query: any) {
    const graduationId = Number(query.graduation_id);
    const page = Number(query.page ?? 1);
    const perPage = Number(query.per_page ?? 10);
    return this.graduationService.getStudentsByGraduation(graduationId, page, perPage);
  }
  
  @Post('graduation/import-excel')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  importExcel(@UploadedFile() file: any, @Body('graduationId') graduationId: string) {
    if (!file) throw new BadRequestException('Vui lòng chọn file Excel');
    return this.graduationService.importStudentsFromExcel(Number(graduationId), file.buffer);
  }

}

