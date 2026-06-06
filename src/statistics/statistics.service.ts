import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';

/** Shape của một câu hỏi được lưu trong formSnapshot */
interface SnapshotQuestion {
  id: string | number;
  questionKey: string;
  questionText: string;
  questionType: string;
  showInChart?: number | boolean;
  chartType?: 'pie' | 'column' | null;
  options?: { id: string; label: string }[] | null;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(AlumniBatch)
    private batchRepo: Repository<AlumniBatch>,

    @InjectRepository(AlumniBatchResponse)
    private responseRepo: Repository<AlumniBatchResponse>,
  ) {}

  // ------------------------------------------------------------------ //
  //  GET /statistics/batches
  //  Trả về danh sách các đợt khảo sát có response submitted
  //  (không giới hạn status = 'ended' vì batch active cũng có data)
  // ------------------------------------------------------------------ //
  async getEndedBatches() {
    // Lấy tất cả batchId có ít nhất 1 response submitted
    const rows = await this.responseRepo
      .createQueryBuilder('r')
      .select('r.batchId', 'batchId')
      .where('r.status = :s', { s: 'submitted' })
      .groupBy('r.batchId')
      .getRawMany<{ batchId: string }>();

    if (!rows.length) return [];

    const ids = rows.map((r) => Number(r.batchId));

    const batches = await this.batchRepo.find({
      where: { id: In(ids) },
      order: { endDate: 'DESC' },
      select: ['id', 'title', 'year', 'graduationPeriod', 'endDate', 'totalStudents', 'status'],
    });

    return batches.map((b) => ({
      id: b.id,
      title: b.title,
      year: b.year,
      graduationPeriod: b.graduationPeriod,
      endDate: b.endDate,
      totalStudents: b.totalStudents,
    }));
  }

  // ------------------------------------------------------------------ //
  //  GET /statistics/questions?batch_id=X
  //  Đọc câu hỏi showInChart = 1 từ formSnapshot của batch.
  //  Ưu tiên formSnapshot (đóng băng lúc tạo đợt); fallback sang
  //  survey_questions table nếu snapshot thiếu trường questions.
  // ------------------------------------------------------------------ //
  async getStatisticalQuestions(batchId: number) {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
      relations: [],
    });
    if (!batch) throw new NotFoundException(`Batch #${batchId} không tồn tại`);

    const questions = this._extractQuestionsFromSnapshot(batch);

    return questions
      .filter((q) => q.showInChart === true || Number(q.showInChart) === 1)
      .map((q) => ({
        questionKey: q.questionKey,
        title: q.questionText,
        chartType: q.chartType ?? 'pie',
        questionType: q.questionType,
      }));
  }

  // ------------------------------------------------------------------ //
  //  GET /statistics?batch_id=X&question_key=Y
  //  Tổng hợp câu trả lời thực từ AlumniBatchResponse.answers cho
  //  một câu hỏi cụ thể trong một đợt khảo sát.
  // ------------------------------------------------------------------ //
  async getStatisticsDetail(batchId: number, questionKey: string) {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException(`Batch #${batchId} không tồn tại`);

    // Tìm định nghĩa câu hỏi trong snapshot
    const questions = this._extractQuestionsFromSnapshot(batch);
    const questionDef = questions.find((q) => q.questionKey === questionKey);
    if (!questionDef) {
      throw new NotFoundException(`Câu hỏi '${questionKey}' không tồn tại trong batch này`);
    }

    // Đọc tất cả responses đã submitted của batch
    const responses = await this.responseRepo.find({
      where: { batchId, status: 'submitted' },
      select: ['id', 'answers'],
    });

    const totalResponses = responses.length;

    // Đếm tần suất mỗi đáp án
    const countMap: Record<string, number> = {};
    let answeredCount = 0;

    for (const r of responses) {
      if (!r.answers) continue;
      const raw = r.answers[questionKey];
      if (raw === undefined || raw === null || raw === '') continue;

      answeredCount++;
      // Checkbox / multi-select trả về mảng
      const vals: string[] = Array.isArray(raw)
        ? raw.map(String)
        : [String(raw)];

      for (const v of vals) {
        if (!v.trim()) continue;
        countMap[v] = (countMap[v] ?? 0) + 1;
      }
    }

    const completionRate =
      totalResponses > 0 ? Math.round((answeredCount / totalResponses) * 100) : 0;

    // Map options sang ChartDatum (radio / checkbox / select)
    let data: { label: string; value: number; percent: number }[] = [];

    if (questionDef.options && questionDef.options.length > 0) {
      data = questionDef.options.map((opt) => {
        // Answers có thể lưu opt.id hoặc opt.label
        const value = countMap[opt.id] ?? countMap[opt.label] ?? 0;
        return {
          label: opt.label,
          value,
          percent:
            answeredCount > 0 ? Math.round((value / answeredCount) * 100) : 0,
        };
      });
    } else {
      // text / number / textarea — trả raw top values
      data = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .map(([label, value]) => ({
          label,
          value,
          percent:
            answeredCount > 0 ? Math.round((value / answeredCount) * 100) : 0,
        }));
    }

    return {
      batchId,
      batchTitle: batch.title,
      questionKey,
      questionTitle: questionDef.questionText,
      chartType: questionDef.chartType ?? 'pie',
      totalResponses,
      answeredCount,
      completionRate,
      data,
    };
  }

  // ------------------------------------------------------------------ //
  //  Private: trích xuất mảng questions từ formSnapshot
  //  formSnapshot có thể là mảng questions trực tiếp, hoặc object
  //  { pages: [{ elements: [...] }] } (SurveyJS format), hoặc
  //  { questions: [...] } (format custom).
  // ------------------------------------------------------------------ //
  private _extractQuestionsFromSnapshot(batch: AlumniBatch): SnapshotQuestion[] {
    const snap = batch.formSnapshot;
    if (!snap) return [];

    /**
     * Normalize một raw question object (bất kể từ format nào)
     * thành SnapshotQuestion chuẩn.
     *
     * Frontend Question dùng:
     *   id         → questionKey
     *   title      → questionText
     *   type       → questionType  (e.g. 'radio', 'checkbox', 'dropdown', 'multiple-choice')
     *   showInChart → showInChart (boolean hoặc 0/1)
     *   chartType   → chartType
     *   options[]  → { id, label }
     *
     * Backend SurveyQuestion dùng:
     *   questionKey, questionText, questionType (đã khớp tên)
     */
    const normalize = (q: any): SnapshotQuestion => ({
      id:           q.id         ?? q.questionKey ?? '',
      questionKey:  q.questionKey ?? q.id          ?? q.name ?? '',
      questionText: q.questionText ?? q.title      ?? q.text ?? q.questionKey ?? '',
      questionType: q.questionType ?? q.type       ?? 'text',
      showInChart:  q.showInChart,
      chartType:    q.chartType ?? null,
      options: Array.isArray(q.options)
        ? q.options.map((o: any) =>
            typeof o === 'string'
              ? { id: o, label: o }
              : { id: String(o.id ?? o.value ?? o.label ?? ''), label: String(o.label ?? o.text ?? o.value ?? o) }
          )
        : Array.isArray(q.choices)
          ? (q.choices as any[]).map((c: any) => ({
              id: String(c.value ?? c),
              label: String(c.text ?? c.value ?? c),
            }))
          : null,
    });

    // Custom format: { questions: [...] }
    if (Array.isArray(snap['questions'])) {
      return (snap['questions'] as any[]).map(normalize);
    }

    // Direct array
    if (Array.isArray(snap)) {
      return (snap as any[]).map(normalize);
    }

    // SurveyJS format: { pages: [{ elements: [...] }] }
    if (Array.isArray(snap['pages'])) {
      const all: SnapshotQuestion[] = [];
      for (const page of snap['pages'] as any[]) {
        const elements = page['elements'] ?? [];
        for (const el of elements) {
          // Map SurveyJS field names → internal shape
          all.push({
            id: el.name ?? el.questionKey,
            questionKey: el.name ?? el.questionKey,
            questionText: el.title ?? el.questionText ?? el.name,
            questionType: el.type ?? el.questionType ?? 'text',
            showInChart: el.showInChart ?? 0,
            chartType: el.chartType ?? null,
            options: el.choices
              ? (el.choices as any[]).map((c: any) => ({
                  id: String(c.value ?? c),
                  label: String(c.text ?? c.value ?? c),
                }))
              : (el.options ?? null),
          });
        }
      }
      return all;
    }

    return [];
  }
}