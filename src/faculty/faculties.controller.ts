/**
 * FacultiesController — xử lý route /faculties/:slug
 * Tách riêng để không conflict với /faculty/:id (numeric)
 */
import { Controller, Get, Param } from '@nestjs/common';
import { FacultyService } from './faculty.service';

@Controller('faculties')
export class FacultiesController {
  constructor(private readonly facultyService: FacultyService) {}

  /**
   * GET /faculties/:slug
   * FE dùng: fetchFacultyBySlug(slug)
   */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.facultyService.findBySlug(slug);
  }
}
