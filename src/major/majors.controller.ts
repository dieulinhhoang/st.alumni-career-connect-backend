/**
 * MajorsController — xử lý route /majors/:slug
 * Tách riêng để không conflict với /major/:id (numeric)
 */
import { Controller, Get, Param } from '@nestjs/common';
import { MajorService } from './major.service';

@Controller('majors')
export class MajorsController {
  constructor(private readonly majorService: MajorService) {}

  /**
   * GET /majors/:slug
   * FE dùng: fetchMajorBySlug(slug)
   */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.majorService.findBySlug(slug);
  }
}
