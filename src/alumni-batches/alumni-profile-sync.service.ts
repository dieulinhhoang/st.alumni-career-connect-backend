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
  async syncFromResponse(response: AlumniBatchResponse, batch: AlumniBatch): Promise<void> {
    const fieldMap = buildFieldMap(batch);
    const a = response.answers ?? {};

    const occupationSector = getStr(a, fieldMap, 'workSector')   || undefined;
    const currentCompany   = getStr(a, fieldMap, 'currentCompany') || undefined;
    const currentPosition  = getStr(a, fieldMap, 'currentPosition') || undefined;
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
