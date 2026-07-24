import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Major } from '../database/entities/major.entity';
import {
  AnswerField,
  ANSWER_KEYS,
  DATE_FIELDS,
  EXCEL_COLUMN_FIELDS,
  EXPORT_COLUMNS,
  MULTI_SELECT_FIELDS,
  NUMBER_FIELDS,
} from './legacy-report.constants';

/** 1 dòng = 1 sinh viên trong file Excel "Báo cáo tổng hợp" (format mới, 1 sheet, 31 cột) */
export interface FlatRow {
  rowIndex: number;
  code: string;
  fullName: string;
  isFemale: boolean;
  cccd: string;
  majorCode: string;
  majorName: string;
  phone: string;
  email: string;
  answers: Record<string, any>;
}

export interface MajorGroup {
  oldCode: string;
  industryName: string;
  total: number;
  totalNu: number;
  responded: number;
  matchedMajorId: number | null;
  suggestedCode: string | null;
  suggestedName: string;
}

/** Nhãn dùng để tính lại preview stats từ `answers` đã decode (khớp options trong form 103) */
const JOB_RELEVANCE_LABELS = {
  dungNganh: 'Đúng ngành đào tạo',
  lienQuan: 'Liên quan đến ngành đào tạo',
  khongLienQuan: 'Không liên quan đến ngành đào tạo',
};
const EMPLOYMENT_STATUS_LABELS = {
  tiepTucHoc: 'Đang tiếp tục học',
  chuaCoVl: 'Chưa có việc làm',
};
const WORK_SECTOR_LABELS = {
  kvNhaNuoc: 'Khu vực Nhà nước',
  kvTuNhan: 'Khu vực tư nhân',
  kvTuTao: 'Tự tạo việc làm',
  kvYNuocNgoai: 'Khu vực có yếu tố nước ngoài',
};

/** Bỏ dấu tiếng Việt, hạ thường, gộp khoảng trắng — dùng để chuẩn hoá header & so khớp tên ngành */
function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Các nhóm tên ngành tương đương đã biết giữa hệ thống cũ và mới */
const KNOWN_NAME_VARIANTS: string[][] = [
  ['mang may tinh va truyen thong du lieu', 'mang may tinh truyen du lieu'],
  ['mang may tinh va truyen du lieu', 'mang may tinh truyen du lieu'],
];

function namesMatch(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return KNOWN_NAME_VARIANTS.some((group) => group.includes(na) && group.includes(nb));
}

/** Chuyển 'dd/mm/yyyy' hoặc Date -> 'yyyy-mm-dd'. Trả về null nếu rỗng/không hợp lệ. */
function ddmmyyyyToIso(value: any): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s;
}

/** Chiều ngược của ddmmyyyyToIso: 'yyyy-mm-dd' hoặc Date -> 'dd/mm/yyyy'. */
function isoToDdmmyyyy(value: any): string {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    const d = String(value.getDate()).padStart(2, '0');
    const mo = String(value.getMonth() + 1).padStart(2, '0');
    return `${d}/${mo}/${value.getFullYear()}`;
  }
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${d.padStart(2, '0')}/${mo.padStart(2, '0')}/${y}`;
  }
  return s;
}

/** Format 1 giá trị answer về đúng dạng chuỗi Excel để parser đọc lại được */
function formatForExport(field: AnswerField, value: any): string | number {
  if (value == null) return '';
  if (DATE_FIELDS.includes(field)) return isoToDdmmyyyy(value);
  if (MULTI_SELECT_FIELDS.includes(field)) {
    return Array.isArray(value) ? value.join(', ') : String(value);
  }
  if (NUMBER_FIELDS.includes(field)) {
    return typeof value === 'number' ? value : String(value);
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value as string | number;
}

/** 1 phản hồi cần xuất — lấy trực tiếp từ AlumniBatchResponse */
export interface ExportResponseRow {
  studentId: string;
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone?: string | null;
  answers?: Record<string, any> | null;
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts[parts.length - 1], lastName: parts.slice(0, -1).join(' ') };
}

function cellText(row: ExcelJS.Row, col: number): string {
  const v = row.getCell(col).value;
  if (v == null) return '';
  if (typeof v === 'object' && 'text' in (v as any)) return String((v as any).text ?? '').trim();
  return String(v).trim();
}

@Injectable()
export class LegacyReportParserService {
  /** Đọc file "Báo cáo tổng hợp" (.xlsx) — format mới: 1 sheet, dòng 1 là header, mỗi dòng tiếp theo = 1 SV */
  async parseWorkbook(buffer: Buffer): Promise<{ rows: FlatRow[] }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    const sheet = wb.worksheets[0];
    if (!sheet) {
      throw new Error('File Excel không có sheet dữ liệu');
    }

    const headerRow = sheet.getRow(1);
    const colFields = new Map<number, AnswerField>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const field = EXCEL_COLUMN_FIELDS[normalizeText(String(cell.value ?? ''))];
      if (field) colFields.set(colNumber, field);
    });
    if (![...colFields.values()].includes('studentCode')) {
      throw new Error('Không tìm thấy cột "Mã sinh viên" trong dòng tiêu đề (dòng 1)');
    }

    const rows: FlatRow[] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const raw: Partial<Record<AnswerField, string>> = {};

      for (const [col, field] of colFields) {
        if (DATE_FIELDS.includes(field)) {
          const iso = ddmmyyyyToIso(row.getCell(col).value);
          if (iso) raw[field] = iso;
        } else {
          const text = cellText(row, col);
          if (text) raw[field] = text;
        }
      }

      if (!raw.studentCode) continue;

      const answers: Record<string, any> = {};
      for (const [field, value] of Object.entries(raw) as [AnswerField, string][]) {
        const key = ANSWER_KEYS[field];
        if (NUMBER_FIELDS.includes(field)) {
          const n = Number(value);
          if (!Number.isNaN(n)) answers[key] = n;
        } else if (MULTI_SELECT_FIELDS.includes(field)) {
          answers[key] = value.split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          answers[key] = value;
        }
      }

      rows.push({
        rowIndex: r,
        code: raw.studentCode,
        fullName: raw.fullName ?? '',
        isFemale: raw.gender === 'Nữ',
        cccd: raw.cccd ?? '',
        majorCode: raw.majorCode ?? '',
        majorName: raw.majorName ?? '',
        phone: raw.phone ?? '',
        email: raw.email ?? '',
        answers,
      });
    }

    return { rows };
  }

  /** Nhóm theo mã ngành, thử khớp với major hiện có trong hệ thống mới */
  buildMajorGroups(rows: FlatRow[], existingMajors: Major[]): MajorGroup[] {
    const groups = new Map<string, { industryName: string; total: number; totalNu: number; responded: number }>();

    for (const r of rows) {
      if (!r.majorCode) continue;
      let g = groups.get(r.majorCode);
      if (!g) {
        g = { industryName: r.majorName, total: 0, totalNu: 0, responded: 0 };
        groups.set(r.majorCode, g);
      }
      g.total++;
      if (r.isFemale) g.totalNu++;
      if (r.answers[ANSWER_KEYS.employmentStatus]) g.responded++;
    }

    return Array.from(groups.entries()).map(([oldCode, g]) => {
      const matched = existingMajors.find((m) => namesMatch(m.name, g.industryName));
      return {
        oldCode,
        industryName: g.industryName,
        total: g.total,
        totalNu: g.totalNu,
        responded: g.responded,
        matchedMajorId: matched?.id ?? null,
        suggestedCode: matched?.code ?? null,
        suggestedName: matched?.name ?? g.industryName,
      };
    });
  }

  /** Tính lại các cột của "Mẫu báo cáo 1" từ `answers` đã có sẵn, để admin so sánh trước khi xác nhận */
  buildPreviewStats(majorGroups: MajorGroup[], rows: FlatRow[]) {
    return majorGroups.map((mg) => {
      const group = rows.filter((r) => r.majorCode === mg.oldCode);
      const countEq = (key: string, label: string) => group.filter((r) => r.answers[key] === label).length;

      return {
        oldCode: mg.oldCode,
        industryName: mg.industryName,
        total: mg.total,
        totalNu: mg.totalNu,
        submitted: mg.responded,
        submittedNu: group.filter((r) => r.isFemale && r.answers[ANSWER_KEYS.employmentStatus]).length,
        dungNganh: countEq(ANSWER_KEYS.jobRelevance, JOB_RELEVANCE_LABELS.dungNganh),
        lienQuan: countEq(ANSWER_KEYS.jobRelevance, JOB_RELEVANCE_LABELS.lienQuan),
        khongLienQuan: countEq(ANSWER_KEYS.jobRelevance, JOB_RELEVANCE_LABELS.khongLienQuan),
        tiepTucHoc: countEq(ANSWER_KEYS.employmentStatus, EMPLOYMENT_STATUS_LABELS.tiepTucHoc),
        chuaCoVl: countEq(ANSWER_KEYS.employmentStatus, EMPLOYMENT_STATUS_LABELS.chuaCoVl),
        kvNhaNuoc: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS.kvNhaNuoc),
        kvTuNhan: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS.kvTuNhan),
        kvTuTao: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS.kvTuTao),
        kvYNuocNgoai: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS.kvYNuocNgoai),
      };
    });
  }

  /**
   * Chiều ngược của parseWorkbook: dựng file Excel "Báo cáo tổng hợp" từ danh sách
   * phản hồi của 1 đợt. Header + thứ tự cột theo EXPORT_COLUMNS nên chính legacy-import
   * đọc lại được (round-trip). Trả về Buffer .xlsx.
   */
  async buildExportWorkbook(responses: ExportResponseRow[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Alumni Career Connect';
    wb.created = new Date();
    const ws = wb.addWorksheet('Báo cáo tổng hợp', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Dòng 1: header (đúng nhãn để parser chuẩn hoá và so khớp)
    ws.addRow(EXPORT_COLUMNS.map((c) => c.header));
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    // Các dòng dữ liệu
    for (const resp of responses) {
      const answers = resp.answers ?? {};
      const row = EXPORT_COLUMNS.map(({ field }) => {
        // Ưu tiên giá trị trong answers (khớp key ANSWER_KEYS), fallback cột cố định
        let value = answers[ANSWER_KEYS[field]];
        if (value == null || value === '') {
          if (field === 'studentCode') value = resp.studentId;
          else if (field === 'fullName') value = resp.studentName;
          else if (field === 'email') value = resp.studentEmail;
          else if (field === 'phone') value = resp.studentPhone;
        }
        return formatForExport(field, value);
      });
      ws.addRow(row);
    }

    // Độ rộng cột gợi ý
    ws.columns.forEach((col, i) => {
      col.width = i < 2 ? 22 : i < 10 ? 16 : 26;
    });

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
