import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailConfig } from 'src/database/entities/email-config.entity';
import { EmailTemplate } from 'src/database/entities/email-template.entity';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

const DEFAULT_TEMPLATES = [
  {
    type: 'enterprise_invite',
    name: 'Lời mời doanh nghiệp',
    description: 'Email gửi cho doanh nghiệp để kích hoạt tài khoản trên hệ thống.',
    subject: 'Lời mời đăng ký tài khoản doanh nghiệp - Học viện Nông nghiệp Việt Nam',
    sections: {
      greeting: 'Xin chào {{ten_doanh_nghiep}},',
      intro: 'Bạn đã được mời tham gia hệ thống Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp với tư cách doanh nghiệp đối tác. Nhấn vào nút bên dưới để thiết lập mật khẩu và kích hoạt tài khoản.',
      button_label: 'Kích hoạt tài khoản →',
      signature: 'Trân Trọng,\nBan Quản trị Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp',
      footer: 'Liên kết có hiệu lực trong 72 giờ. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.',
    },
    isActive: true,
  },
  {
    type: 'job_application',
    name: 'Thông báo ứng tuyển mới',
    description: 'Email thông báo cho doanh nghiệp khi có ứng viên nộp hồ sơ.',
    subject: '[Ứng tuyển mới] {{ten_ung_vien}} ứng tuyển vị trí {{ten_viec}}',
    sections: {
      greeting: 'Xin chào,',
      intro: 'Có ứng viên mới ứng tuyển vào vị trí <strong>{{ten_viec}}</strong> tại hệ thống.',
      signature: 'Trân Trọng,\nBan Quản trị Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp',
      footer: 'Email này được gửi tự động từ hệ thống Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp. Vui lòng không trả lời.',
    },
    isActive: true,
  },
  {
    type: 'password_setup',
    name: 'Thiết lập mật khẩu lần đầu',
    description: 'Email gửi cho người dùng đăng nhập qua SSO lần đầu để thiết lập mật khẩu.',
    subject: 'Thiết lập mật khẩu tài khoản - Học viện Nông nghiệp Việt Nam',
    sections: {
      greeting: 'Xin chào {{ten_nguoi_dung}},',
      intro: 'Tài khoản của bạn đã được tạo trên hệ thống Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp. Nhấn vào nút bên dưới để thiết lập mật khẩu và bắt đầu sử dụng.',
      button_label: 'Thiết lập mật khẩu →',
      signature: 'Trân Trọng,\nBan Quản trị Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp',
      footer: 'Liên kết có hiệu lực trong 24 giờ. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.',
    },
    isActive: true,
  },
  {
    type: 'password_reset',
    name: 'Đặt lại mật khẩu',
    description: 'Email gửi xác nhận để đặt lại mật khẩu.',
    subject: 'Yêu cầu đặt lại mật khẩu - Học viện Nông nghiệp Việt Nam',
    sections: {
      greeting: 'Xin chào {{ten_nguoi_dung}},',
      intro: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới.',
      button_label: 'Đặt lại mật khẩu →',
      signature: 'Trân Trọng,\nBan Quản trị Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp',
      footer: 'Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.',
    },
    isActive: true,
  },
  {
    type: 'survey_invite',
    name: 'Mời tham gia khảo sát',
    description: 'Email mời cựu sinh viên tham gia khảo sát việc làm.',
    subject: 'Mời bạn tham gia khảo sát: {{ten_khao_sat}} - Học viện Nông nghiệp Việt Nam',
    sections: {
      greeting: 'Xin chào {{ten_nguoi_dung}},',
      intro: 'Khoa Công nghệ Thông tin – Học viện Nông nghiệp Việt Nam trân trọng mời bạn tham gia khảo sát <strong>{{ten_khao_sat}}</strong>. Thông tin của bạn sẽ giúp chúng tôi cải thiện chất lượng đào tạo.',
      button_label: 'Tham gia khảo sát →',
      signature: 'Trân Trọng,\nBan Quản trị Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp',
      footer: 'Email này được gửi tự động. Vui lòng không trả lời trực tiếp email này.',
    },
    isActive: true,
  },
  {
    type: 'job_opportunity',
    name: 'Thông báo tuyển dụng',
    description: 'Email thông báo cơ hội tuyển dụng cho cựu sinh viên chưa có việc làm (theo kết quả khảo sát).',
    subject: '[Cơ hội việc làm] {{ten_viec}} tại {{ten_doanh_nghiep}}',
    sections: {
      greeting: 'Xin chào {{ten_nguoi_dung}},',
      intro: 'Qua kết quả khảo sát tình hình việc làm, hệ thống Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp nhận thấy bạn hiện chưa có việc làm. Chúng tôi xin gửi đến bạn một cơ hội tuyển dụng phù hợp:<br><br>' +
        '<strong>Vị trí:</strong> {{ten_viec}}<br>' +
        '<strong>Đơn vị tuyển dụng:</strong> {{ten_doanh_nghiep}}<br>' +
        '<strong>Địa điểm:</strong> {{dia_diem}}<br>' +
        '<strong>Mức lương:</strong> {{luong}}',
      button_label: 'Xem chi tiết & ứng tuyển →',
      signature: 'Trân Trọng,\nBan Quản trị Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp',
      footer: 'Email này được gửi tự động dựa trên kết quả khảo sát việc làm bạn đã cung cấp. Vui lòng không trả lời trực tiếp email này.',
    },
    isActive: true,
  },
];

@Injectable()
export class MailSettingsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(EmailConfig) private configRepo: Repository<EmailConfig>,
    @InjectRepository(EmailTemplate) private templateRepo: Repository<EmailTemplate>,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureConfigExists();
    await this.seedDefaultTemplates();
    await this.migrateLegacyBranding();
  }

  // Đổi tên hệ thống trong các template/config ĐÃ LƯU trong DB
  // (seed chỉ chạy lần đầu nên sửa DEFAULT_TEMPLATES không tự cập nhật dữ liệu cũ).
  // Idempotent: không còn tên cũ thì không làm gì.
  private async migrateLegacyBranding() {
    const OLD = 'Alumni Career Connect';
    const NEW = 'Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp';

    const templates = await this.templateRepo.find();
    for (const t of templates) {
      let changed = false;
      if (t.subject?.startsWith(`[${OLD}] `)) {
        // "[Tên cũ] Tiêu đề" → "Tiêu đề - Học viện Nông nghiệp Việt Nam" (tên mới quá dài để làm prefix)
        t.subject = `${t.subject.slice(OLD.length + 3)} - Học viện Nông nghiệp Việt Nam`;
        changed = true;
      } else if (t.subject?.includes(OLD)) {
        t.subject = t.subject.split(OLD).join(NEW);
        changed = true;
      }
      const sectionsJson = JSON.stringify(t.sections ?? null);
      if (sectionsJson.includes(OLD)) {
        t.sections = JSON.parse(sectionsJson.split(OLD).join(NEW));
        changed = true;
      }
      if (changed) await this.templateRepo.save(t);
    }

    const config = await this.configRepo.findOne({ where: {}, order: { id: 'ASC' } });
    if (config?.senderName?.includes(OLD)) {
      config.senderName = config.senderName.split(OLD).join(NEW);
      await this.configRepo.save(config);
    }
  }

  private async ensureConfigExists() {
    const count = await this.configRepo.count();
    if (count === 0) {
      await this.configRepo.save(
        this.configRepo.create({ mailer: 'smtp', host: '', port: 587, account: '', password: null, senderName: 'Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp', isActive: false }),
      );
    }
  }

  private async seedDefaultTemplates() {
    for (const tpl of DEFAULT_TEMPLATES) {
      const exists = await this.templateRepo.findOne({ where: { type: tpl.type } });
      if (!exists) {
        await this.templateRepo.save(this.templateRepo.create(tpl));
      }
    }
  }

  // ── Email Config ─────────────────────────────────────────────────────────

  async getConfig(): Promise<EmailConfig> {
    return this.configRepo.findOne({ where: {}, order: { id: 'ASC' } }) as Promise<EmailConfig>;
  }

  async updateConfig(dto: UpdateEmailConfigDto): Promise<EmailConfig> {
    const config = await this.getConfig();
    // nếu password là chuỗi rỗng → giữ nguyên password cũ
    if (dto.password === '') delete dto.password;
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  private async getTransporter(): Promise<{ transporter: nodemailer.Transporter; config: EmailConfig }> {
    const config = await this.getConfig();
    if (!config.isActive || !config.host || !config.account || !config.password) {
      throw new Error('Cấu hình email chưa đầy đủ hoặc chưa được kích hoạt');
    }
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.account, pass: config.password },
    });
    return { transporter, config };
  }

  /** Gửi email cho 1 người nhận theo type template (vd 'job_opportunity'), thay {{key}} bằng vars. */
  async sendByTemplate(type: string, to: string, vars: Record<string, string>): Promise<void> {
    const template = await this.getTemplateByType(type);
    if (!template || !template.isActive) {
      throw new Error(`Template "${type}" không tồn tại hoặc đang tắt`);
    }
    const { transporter, config } = await this.getTransporter();
    const subject = (template.subject || '').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    await transporter.sendMail({
      from: `"${config.senderName}" <${config.account}>`,
      to,
      subject,
      html: this.renderHtml(template, vars),
    });
  }

  async sendTestEmail(to: string): Promise<void> {
    const { transporter, config } = await this.getTransporter();

    await transporter.verify();
    await transporter.sendMail({
      from: `"${config.senderName}" <${config.account}>`,
      to,
      subject: 'Email kiểm tra cấu hình - Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
          <div style="background:#1D9E75;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <h2 style="color:#fff;margin:0;font-size:17px;line-height:1.45;">Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp</h2>
          </div>
          <p style="color:#0f172a;font-size:16px;">Xin chào,</p>
          <p style="color:#475569;line-height:1.7;">Đây là email kiểm tra cấu hình SMTP của hệ thống. Nếu bạn nhận được email này, cấu hình đã hoạt động đúng.</p>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">Email này được gửi tự động từ hệ thống Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp.</p>
        </div>
      `,
    });
  }

  // ── Email Templates ───────────────────────────────────────────────────────

  async getAllTemplates(): Promise<EmailTemplate[]> {
    return this.templateRepo.find({ order: { id: 'ASC' } });
  }

  async getTemplateById(id: number): Promise<EmailTemplate> {
    return this.templateRepo.findOne({ where: { id } }) as Promise<EmailTemplate>;
  }

  async getTemplateByType(type: string): Promise<EmailTemplate | null> {
    return this.templateRepo.findOne({ where: { type } });
  }

  async updateTemplate(id: number, dto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new Error('Không tìm thấy template');
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async getPreviewHtml(id: number): Promise<string> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new Error('Không tìm thấy template');
    return this.renderHtml(template, {
      ten_nguoi_dung: 'Nguyễn Văn A',
      ten_doanh_nghiep: 'Công ty Mẫu ABC',
      ten_viec: 'Kỹ sư phần mềm',
      ten_ung_vien: 'Trần Thị B',
      email_ung_vien: 'b.tran@example.com',
      sdt_ung_vien: '0912 345 678',
      ten_khao_sat: 'Khảo sát việc làm 2026',
      dia_diem: 'Hà Nội',
      luong: '10 - 15 triệu',
      button_url: '#',
    });
  }

  // ── Renderer ─────────────────────────────────────────────────────────────

  renderHtml(template: EmailTemplate, vars: Record<string, string>): string {
    const sub = (text: string) =>
      (text || '').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

    const s = template.sections || {};
    const greeting = sub(s.greeting || '');
    const intro = sub(s.intro || '');
    const buttonLabel = sub(s.button_label || '');
    const signature = sub(s.signature || '').replace(/\n/g, '<br>');
    const footer = sub(s.footer || '');
    const buttonUrl = vars.button_url || '#';

    const buttonHtml = buttonLabel
      ? `<div style="text-align:center;margin:28px 0;">
           <a href="${buttonUrl}" style="background:#1D9E75;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">${buttonLabel}</a>
         </div>`
      : '';

    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
        <div style="background:#1D9E75;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <h2 style="color:#fff;margin:0;font-size:17px;line-height:1.45;">Ứng dụng khảo sát việc làm và hỗ trợ kết nối doanh nghiệp</h2>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Học viện Nông nghiệp Việt Nam</p>
        </div>
        ${greeting ? `<p style="color:#0f172a;font-size:16px;margin:0 0 16px;">${greeting}</p>` : ''}
        ${intro ? `<p style="color:#475569;line-height:1.7;margin:0 0 20px;">${intro}</p>` : ''}
        ${buttonHtml}
        ${signature ? `<p style="color:#475569;margin:24px 0 0;">${signature}</p>` : ''}
        ${footer ? `<p style="color:#94a3b8;font-size:12px;text-align:center;margin:24px 0 0;">${footer}</p>` : ''}
      </div>
    `;
  }
}
