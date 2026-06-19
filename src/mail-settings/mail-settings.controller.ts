import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MailSettingsService } from './mail-settings.service';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { RequirePermission } from 'src/auth/decorators/require-permission.decorator';

@Controller('mail-settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MailSettingsController {
  constructor(private readonly service: MailSettingsService) {}

  // ── Config ────────────────────────────────────────────────────────────────

  @Get('config')
  @RequirePermission('settings:read')
  getConfig() {
    return this.service.getConfig();
  }

  @Patch('config')
  @RequirePermission('settings:update')
  updateConfig(@Body() dto: UpdateEmailConfigDto) {
    return this.service.updateConfig(dto);
  }

  @Post('config/test')
  @RequirePermission('settings:update')
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    await this.service.sendTestEmail(dto.to);
    return { success: true, message: 'Email kiểm tra đã được gửi thành công' };
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  @Get('templates')
  @RequirePermission('settings:read')
  getAllTemplates() {
    return this.service.getAllTemplates();
  }

  @Get('templates/:id')
  @RequirePermission('settings:read')
  getTemplate(@Param('id') id: string) {
    return this.service.getTemplateById(+id);
  }

  @Get('templates/:id/preview')
  @RequirePermission('settings:read')
  async getPreview(@Param('id') id: string) {
    const html = await this.service.getPreviewHtml(+id);
    return { html };
  }

  @Patch('templates/:id')
  @RequirePermission('settings:update')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.service.updateTemplate(+id, dto);
  }
}
