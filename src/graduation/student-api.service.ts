import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Cầu nối gọi sang hệ thống ST Student (tương đương App\Services\StudentService bên Laravel).
 *
 * Cơ chế xác thực của các route /api/v1/external/... KHÔNG dùng client_credentials
 * (đã kiểm chứng: mọi scope đều trả 401). Thay vào đó phải đổi SSO token của cán bộ
 * đang đăng nhập qua /api/verify để lấy "student token", rồi dùng token đó gọi API —
 * đúng như GraduationController cũ đọc $user->st_students_token.
 */
@Injectable()
export class StudentApiService {
  private readonly logger = new Logger(StudentApiService.name);

  constructor(private readonly http: HttpService) {}

  /** Base URL của ST Student, đọc từ .env (STUDENT_IP -> STUDENT_URL). */
  private get baseUrl(): string {
    return (process.env.STUDENT_IP || process.env.STUDENT_URL || '').replace(/\/+$/, '');
  }

  /**
   * Đổi SSO token (access_token cán bộ lưu lúc đăng nhập) lấy student token dùng cho API external.
   * POST /api/verify { access_token } -> { token }
   */
  async verify(ssoToken: string): Promise<string> {
    if (!ssoToken) {
      throw new UnauthorizedException('Thiếu SSO token của người dùng để đồng bộ ST Student');
    }

    let data: any;
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/api/verify`,
          { access_token: ssoToken },
          { headers: { Accept: 'application/json' }, timeout: 30_000 },
        ),
      );
      data = res.data;
    } catch (err: any) {
      const body = err?.response?.data;
      this.logger.error(`/api/verify lỗi: ${JSON.stringify(body ?? err?.message)}`);
      throw new UnauthorizedException(
        body?.message ?? 'Không xác thực được với ST Student (SSO token không hợp lệ hoặc đã hết hạn)',
      );
    }

    const token = data?.token;
    if (!token) {
      throw new UnauthorizedException(
        data?.message ?? 'ST Student không trả về student token từ /api/verify',
      );
    }
    return token;
  }

  /** GET một endpoint external kèm student token (Bearer) đã verify. */
  async get<T = any>(
    endpoint: string,
    params: Record<string, any>,
    studentToken: string,
  ): Promise<T> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}${endpoint}`, {
          headers: { Authorization: `Bearer ${studentToken}`, Accept: 'application/json' },
          params,
          timeout: 300_000,
        }),
      );
      return data as T;
    } catch (err: any) {
      this.logger.error(`GET ${endpoint} lỗi: ${err?.response?.status ?? ''} ${err?.message}`);
      throw err;
    }
  }
}
