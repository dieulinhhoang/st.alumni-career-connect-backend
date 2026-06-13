import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
}
