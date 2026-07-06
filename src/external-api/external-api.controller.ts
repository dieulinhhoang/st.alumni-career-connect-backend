import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ExternalApiService } from './external-api.service';
import type { CreateApiKeyDto } from './external-api.service';
import { ApiKeyGuard } from '../guards/api-key/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('external-api')
export class ExternalApiController {
  constructor(private readonly svc: ExternalApiService) {}

  // ─── Quản lý API key (yêu cầu đăng nhập admin) ──────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('keys')
  listKeys() {
    return this.svc.listApiKeys();
  }

  @UseGuards(JwtAuthGuard)
  @Post('keys')
  createKey(@Body() dto: CreateApiKeyDto) {
    return this.svc.createApiKey(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('keys/:id/revoke')
  revokeKey(@Param('id', ParseIntPipe) id: number) {
    return this.svc.revokeApiKey(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('keys/:id')
  deleteKey(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteApiKey(id);
  }

  // ─── Dữ liệu cựu sinh viên (yêu cầu API key) ────────────────────────────────

  /**
   * GET /external-api/alumni-career
   * Query: student_code, major, page, limit
   */
  @UseGuards(ApiKeyGuard)
  @Get('alumni-career')
  getAlumniCareer(
    @Query('student_code') studentCode?: string,
    @Query('major')  major?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.svc.getAlumniCareer({
      studentCode: studentCode || undefined,
      major:       major       || undefined,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 100,
    });
  }

  /** GET /external-api/alumni-career/:studentCode */
  @UseGuards(ApiKeyGuard)
  @Get('alumni-career/:studentCode')
  getAlumniCareerByCode(@Param('studentCode') studentCode: string) {
    return this.svc.getAlumniCareerByCode(studentCode);
  }
}
