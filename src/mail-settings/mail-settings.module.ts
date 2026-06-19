import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConfig } from 'src/database/entities/email-config.entity';
import { EmailTemplate } from 'src/database/entities/email-template.entity';
import { MailSettingsService } from './mail-settings.service';
import { MailSettingsController } from './mail-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfig, EmailTemplate])],
  controllers: [MailSettingsController],
  providers: [MailSettingsService],
  exports: [MailSettingsService],
})
export class MailSettingsModule {}
