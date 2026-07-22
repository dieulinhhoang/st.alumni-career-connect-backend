import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniProfile } from '../database/entities/alumni-profile.entity';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { buildFieldMap, getStr } from '../reports/reports.service';

@Injectable()
export class AlumniProfileSyncService {
  constructor(
    @InjectRepository(AlumniProfile)
    private profileRepo: Repository<AlumniProfile>,
  ) {}

  /**
   * Đọc câu trả lời nghề nghiệp từ response và upsert vào alumni_profiles.
   * Gọi sau mỗi lần submit / cập nhật response.
   */
  /** Dò câu trả lời theo TIÊU ĐỀ câu hỏi (khi câu hỏi không gán excelColumn) */
  private answerByTitle(
    batch: AlumniBatch,
    answers: Record<string, any>,
    keywords: string[],
  ): string | undefined {
    const questions: any[] = (batch?.formSnapshot as any)?.questions ?? [];
    const q = questions.find((x) => {
      const t = String(x?.title ?? '').toLowerCase();
      return keywords.some((k) => t.includes(k));
    });
    if (!q) return undefined;
    const v = answers?.[q.id];
    if (v == null || v === '') return undefined;
    const s = typeof v === 'object' ? Object.values(v).filter(Boolean).join(', ') : String(v);
    return s.trim() || undefined;
  }

  async syncFromResponse(response: AlumniBatchResponse, batch: AlumniBatch): Promise<void> {
    const fieldMap = buildFieldMap(batch);
    const a = response.answers ?? {};

    const occupationSector = getStr(a, fieldMap, 'workSector')   || undefined;
    // Nhiều form KHÔNG gán excelColumn cho câu "Tên đơn vị tuyển dụng" / "Chức vụ, vị trí việc làm".
    // → fallback dò theo tiêu đề câu hỏi để vẫn lưu được công ty/chức vụ vào profile.
    const currentCompany =
      getStr(a, fieldMap, 'currentCompany') ||
      this.answerByTitle(batch, a, ['đơn vị tuyển dụng', 'tên đơn vị', 'tên công ty', 'công ty', 'doanh nghiệp']) ||
      undefined;
    const currentPosition =
      getStr(a, fieldMap, 'currentPosition') ||
      this.answerByTitle(batch, a, ['chức vụ', 'vị trí việc làm', 'vị trí công việc']) ||
      undefined;
    const workLocation     = getStr(a, fieldMap, 'workLocation')  || undefined;

    // Nếu không có field nào thì bỏ qua, không tạo profile rỗng
    if (!occupationSector && !currentCompany && !currentPosition && !workLocation) return;

    const existing = await this.profileRepo.findOne({
      where: { studentCode: response.studentId },
    });

    if (existing) {
      await this.profileRepo.update(existing.id, {
        fullName:         response.studentName  ?? existing.fullName,
        email:            response.studentEmail ?? existing.email,
        phone:            response.studentPhone ?? existing.phone,
        ...(occupationSector && { occupationSector }),
        ...(currentCompany   && { currentCompany }),
        ...(currentPosition  && { currentPosition }),
        ...(workLocation     && { workLocation }),
      });
    } else {
      await this.profileRepo.save(
        this.profileRepo.create({
          studentCode:      response.studentId,
          fullName:         response.studentName  ?? '',
          email:            response.studentEmail ?? undefined,
          phone:            response.studentPhone ?? undefined,
          occupationSector,
          currentCompany,
          currentPosition,
          workLocation,
        }),
      );
    }
  }
}
