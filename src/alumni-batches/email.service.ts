import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { env } from 'process';
export interface SendEmailOptions {
    from: string;
    to: string;
    subject: string;
    html?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Port 587 bắt buộc phải là false
            auth: {
                user: env.EMAIL_USER || '',
                pass: env.EMAIL_PASS || '',
            },
            tls: {
                // Thêm cái này để đảm bảo Node và Google bắt tay TLS mượt mà ở port 587
                rejectUnauthorized: false
            }
        });
    }
    async sendOne(options: SendEmailOptions): Promise<void> {
        for (let a = 1; a <= 3; a++) {
            try {
                await this.transporter.sendMail({
                    from: options.from,
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                });

            } catch (error) {
                this.logger.error('Error sending email:', error);
                throw error;
                a++;
                if (a < 3) {
                    await new Promise(r => setTimeout(r, 1000 * a)); // chờ 1s, 2s trước khi retry
                }
            }
        }
    }

    // async sendMany(options: SendEmailOptions[]): Promise<void> {
    //     for (const option of options) {
    //         await this.sendOne(option);
    //     }
    // }


    async sendBulk(
        recipients: Array<{ email: string; subject: string; html: string }>,
        ratePerMinute = 30,
    ): Promise<{ sent: number; failed: number }> {
        const delayMs = Math.ceil(60_000 / ratePerMinute);
        let sent = 0;
        let failed = 0;
        // 60_000ms / 30 = 2000ms → chờ 2 giây giữa mỗi email
        for (const { email, subject, html } of recipients) {
            try {
                await this.transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: subject,
                    html: html,
                });
                sent++;
            } catch (error) {
                this.logger.error(`Error sending email to ${email}:`, error);
                failed++;
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));

        }

        this.logger.log(`Bulk email hoàn thành: ${sent} thành công, ${failed} thất bại`);
        return { sent, failed };
    }
}