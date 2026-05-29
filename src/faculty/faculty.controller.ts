import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultyService.create(createFacultyDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.facultyService.findAll(query);
  }

  // Literal route phải khai báo trước dynamic :id — đã đúng
  @Get('list')
  findAllList() {
    return this.facultyService.findAllList();
  }

  // Gộp :id và :slug vào một handler — tránh hai route dynamic trùng nhau
  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!isNaN(Number(id))) {
      return this.facultyService.findOne(+id);
    }
    return this.facultyService.findBySlug(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultyService.update(+id, updateFacultyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.facultyService.remove(+id);
  }
}
