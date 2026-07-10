import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('EMAIL_HOST'),
      port: config.get<number>('EMAIL_PORT'),
      secure: config.get('EMAIL_SECURE') === 'true',
      auth: {
        user: config.get('EMAIL_USER'),
        pass: config.get('EMAIL_PASS'),
      },
    });
  }

  async sendEnterpriseInvite(to: string, enterpriseName: string, inviteLink: string) {
    await this.transporter.sendMail({
      from: `"Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp" <${this.config.get('EMAIL_USER')}>`,
      to,
      subject: `Lời mời đăng ký tài khoản doanh nghiệp - Học viện Nông nghiệp Việt Nam`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
          <div style="background:#1D9E75;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <h2 style="color:#fff;margin:0;font-size:17px;line-height:1.45;">Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp</h2>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Học viện Nông nghiệp Việt Nam</p>
          </div>
          <h3 style="color:#0f172a;font-size:18px;margin:0 0 12px;">Xin chào <strong>${enterpriseName}</strong>,</h3>
          <p style="color:#475569;line-height:1.7;margin:0 0 20px;">
            Bạn đã được mời tham gia hệ thống <strong>Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp</strong> với tư cách doanh nghiệp đối tác.
            Nhấn vào nút bên dưới để thiết lập mật khẩu và kích hoạt tài khoản.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${inviteLink}" style="background:#1D9E75;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
              Kích hoạt tài khoản →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            Liên kết có hiệu lực trong 72 giờ. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.
          </p>
        </div>
      `,
    });
    this.logger.log(`Invite sent to ${to}`);
  }

  async sendApplicationNotification(to: string, jobTitle: string, applicantName: string, applicantEmail: string, applicantPhone: string, message?: string) {
    await this.transporter.sendMail({
      from: `"Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp" <${this.config.get('EMAIL_USER')}>`,
      to,
      subject: `[Ứng tuyển mới] ${applicantName} ứng tuyển vị trí ${jobTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
          <div style="background:#1D9E75;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">Có ứng viên mới!</h2>
          </div>
          <p style="color:#475569;line-height:1.7;margin:0 0 16px;">Vị trí: <strong>${jobTitle}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:10px 14px;background:#f1f5f9;border-radius:8px 8px 0 0;font-weight:600;color:#0f172a;">Họ tên</td><td style="padding:10px 14px;background:#f8fafc;">${applicantName}</td></tr>
            <tr><td style="padding:10px 14px;background:#f1f5f9;font-weight:600;color:#0f172a;">Email</td><td style="padding:10px 14px;background:#f8fafc;">${applicantEmail}</td></tr>
            <tr><td style="padding:10px 14px;background:#f1f5f9;font-weight:600;color:#0f172a;">Điện thoại</td><td style="padding:10px 14px;background:#f8fafc;">${applicantPhone}</td></tr>
            ${message ? `<tr><td style="padding:10px 14px;background:#f1f5f9;border-radius:0 0 8px 8px;font-weight:600;color:#0f172a;">Lời nhắn</td><td style="padding:10px 14px;background:#f8fafc;">${message}</td></tr>` : ''}
          </table>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:24px 0 0;">
            Email này được gửi tự động từ hệ thống Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp.
          </p>
        </div>
      `,
    });
  }
}
