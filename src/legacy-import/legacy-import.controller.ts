import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LegacyImportService } from './legacy-import.service';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ConfirmImportDto } from './dto/confirm-import.dto';

@Controller('alumni/legacy-import')
@UseGuards(JwtAuthGuard)
export class LegacyImportController {
  constructor(private readonly service: LegacyImportService) {}

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async preview(@UploadedFile() file: any, @Body() dto: PreviewImportDto) {
    if (!file) throw new BadRequestException('Vui lòng chọn file Excel (.xlsx)');
    return this.service.preview(file.buffer, Number(dto.formId));
  }

  @Post('confirm')
  async confirm(@Body() dto: ConfirmImportDto) {
    return this.service.execute(dto);
  }

  /** Xuất phản hồi của 1 đợt ra Excel định dạng legacy (import lại được) */
  @Get('export')
  async export(@Query('batchId') batchId: string, @Res() res: Response) {
    const id = Number(batchId);
    if (!id) throw new BadRequestException('Thiếu batchId');
    const { filename, buffer } = await this.service.exportBatch(id);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}
