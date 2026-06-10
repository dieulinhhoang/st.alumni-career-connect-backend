import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { CreateGraduationDto } from './dto/create-graduation.dto';
import { UpdateGraduationDto } from './dto/update-graduation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller()
// @UseGuards(JwtAuthGuard)
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) { }
  
  // POST /graduation
  @Post('graduation')
  create(@Body() createGraduationDto: CreateGraduationDto) {
    return this.graduationService.create(createGraduationDto);
  }

  @Post('graduation/verify-student')
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

  // GET /grad-students?graduation_id=1&page=1&per_page=10
  @Get('grad-students')
  getStudents(@Query() query: any) {
    const graduationId = Number(query.graduation_id);
    const page = Number(query.page ?? 1);
    const perPage = Number(query.per_page ?? 10);
    return this.graduationService.getStudentsByGraduation(graduationId, page, perPage);
  }


}
