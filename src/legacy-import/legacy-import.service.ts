import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Major } from '../database/entities/major.entity';
import { Student } from '../database/entities/student.entity';
import { Graduation } from '../database/entities/graduation.entity';
import { GraduationStudent } from '../database/entities/graduation-student.entity';
import { FacultyReportSubmission } from '../database/entities/faculty-report-submission.entity';
import { SurveysService } from '../surveys/surveys.service';
import { LegacyReportParserService, splitName } from './legacy-report-parser.service';
import { ANSWER_KEYS } from './legacy-report.constants';
import { ConfirmImportDto } from './dto/confirm-import.dto';

@Injectable()
export class LegacyImportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly parser: LegacyReportParserService,
    private readonly surveysService: SurveysService,
    @InjectRepository(Major) private readonly majorRepo: Repository<Major>,
  ) {}

  async preview(buffer: Buffer, formId: number) {
    const { rows } = await this.parser.parseWorkbook(buffer);
    const existingMajors = await this.majorRepo.find();
    const majorGroups = this.parser.buildMajorGroups(rows, existingMajors);
    const previewStats = this.parser.buildPreviewStats(majorGroups, rows);

    return { formId, roster: rows, responses: rows, majorGroups, previewStats };
  }

  async execute(dto: ConfirmImportDto) {
    return this.dataSource.transaction(async (manager) => {
      const form = await this.surveysService.findOne(dto.formId);
      const formSnapshot = this.surveysService.mapToForm(form);

      // 1) Resolve major cho từng mã ngành cũ (map vào major có sẵn hoặc tạo mới)
      // Batch load tất cả matched majors trong 1 query thay vì N queries
      const matchedMajorIds = dto.majorGroups
        .filter(mg => mg.matchedMajorId)
        .map(mg => mg.matchedMajorId!);
      const existingMajorList = matchedMajorIds.length
        ? await manager.findBy(Major, { id: In(matchedMajorIds) })
        : [];
      const majorById = new Map(existingMajorList.map(m => [m.id, m]));

      const majorByOldCode = new Map<string, { id: number; code: string; name: string; facultyId: number | null }>();
      for (const mg of dto.majorGroups) {
        if (mg.matchedMajorId) {
          const existing = majorById.get(mg.matchedMajorId);
          if (!existing) throw new BadRequestException(`Không tìm thấy ngành #${mg.matchedMajorId}`);
          majorByOldCode.set(mg.oldCode, {
            id: existing.id,
            code: existing.code,
            name: existing.name,
            facultyId: existing.facultyId ?? null,
          });
        } else if (mg.newMajor) {
          const saved = await manager.save(
            Major,
            manager.create(Major, {
              code: mg.newMajor.code,
              name: mg.newMajor.name,
              facultyId: mg.newMajor.facultyId ?? undefined,
              status: 1,
            }),
          );
          majorByOldCode.set(mg.oldCode, {
            id: saved.id,
            code: saved.code,
            name: saved.name,
            facultyId: saved.facultyId ?? null,
          });
        } else {
          throw new BadRequestException(
            `Ngành "${mg.industryName}" (mã ${mg.oldCode}) chưa được map vào ngành có sẵn hoặc tạo mới`,
          );
        }
      }

      // 2) Tạo đợt tốt nghiệp mới
      const savedGraduation = await manager.save(
        Graduation,
        manager.create(Graduation, {
          name: dto.batch.graduationName,
          schoolYear: dto.batch.year,
        }),
      );

      // 3) Tạo đợt khảo sát (alumni_batches) mới
      const savedBatch = await manager.save(
        AlumniBatch,
        manager.create(AlumniBatch, {
          title: dto.batch.title,
          formId: dto.formId,
          formSnapshot: formSnapshot as any,
          status: 'ended',
          startDate: dto.batch.startDate,
          endDate: dto.batch.endDate,
          year: dto.batch.year,
          graduationPeriod: dto.batch.graduationName,
          graduationId: savedGraduation.id,
          totalStudents: dto.roster.length,
        }),
      );

      // 4) Tạo student + graduation_student cho toàn bộ danh sách (Mẫu báo cáo 2)
      // Batch load tất cả students theo code trong 1 query
      const rosterCodes = dto.roster.map(r => r.code);
      const existingStudents = rosterCodes.length
        ? await manager.findBy(Student, { code: In(rosterCodes) })
        : [];
      const studentByCode = new Map(existingStudents.map(s => [s.code, s]));

      for (const r of dto.roster) {
        const major = majorByOldCode.get(r.majorCode);
        let student = studentByCode.get(r.code);
        if (!student) {
          const { firstName, lastName } = splitName(r.fullName);
          student = await manager.save(
            Student,
            manager.create(Student, {
              code: r.code,
              fullName: r.fullName,
              firstName,
              lastName,
              email: r.email || undefined,
              phone: r.phone || undefined,
              gender: r.isFemale ? 'female' : 'male',
              citizenIdentification: r.cccd || undefined,
              trainingIndustryId: major?.id ?? undefined,
              schoolYearEnd: dto.batch.year ? String(dto.batch.year) : undefined,
            }),
          );
          studentByCode.set(r.code, student);
        }

        // savedGraduation vừa tạo mới → không cần check tồn tại
        await manager.save(
          GraduationStudent,
          manager.create(GraduationStudent, {
            graduationId: savedGraduation.id,
            studentId: student.id,
          }),
        );
      }

      // 5) Tạo alumni_batch_responses cho các SV đã phản hồi (Mẫu báo cáo 3)
      const facultyIds = new Set<number>();
      for (const r of dto.responses) {
        const major = majorByOldCode.get(r.majorCode);
        const answers = {
          ...r.answers,
          [ANSWER_KEYS.majorCode]: major?.code ?? r.answers?.[ANSWER_KEYS.majorCode],
          [ANSWER_KEYS.majorName]: major?.name ?? r.answers?.[ANSWER_KEYS.majorName],
        };

        await manager.save(
          AlumniBatchResponse,
          manager.create(AlumniBatchResponse, {
            batchId: savedBatch.id,
            studentId: r.code,
            studentName: r.fullName,
            studentEmail: r.email || null,
            studentPhone: r.phone || null,
            answers,
            submittedAt: new Date(),
            status: 'submitted',
          }),
        );

        if (major?.facultyId) facultyIds.add(major.facultyId);
      }

      // 6) Đánh dấu các khoa liên quan đã nộp báo cáo để hiển thị ngay trong admin
      // Batch check trong 1 query thay vì N queries
      if (facultyIds.size > 0) {
        const existingSubmissions = await manager.findBy(FacultyReportSubmission, {
          batchId: savedBatch.id,
          facultyId: In([...facultyIds]),
        });
        const alreadySubmitted = new Set(existingSubmissions.map(s => s.facultyId));

        const newSubmissions = [...facultyIds]
          .filter(fid => !alreadySubmitted.has(fid))
          .map(facultyId =>
            manager.create(FacultyReportSubmission, {
              batchId: savedBatch.id,
              facultyId,
              status: 'submitted',
              submittedBy: 'Import dữ liệu',
              submittedAt: new Date(),
            }),
          );
        if (newSubmissions.length) {
          await manager.save(FacultyReportSubmission, newSubmissions);
        }
      }

      return { batchId: savedBatch.id };
    });
  }
}
