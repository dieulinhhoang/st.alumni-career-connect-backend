import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Major } from '../database/entities/major.entity';
import {
  ANSWER_KEYS,
  AVG_INCOME_LABELS,
  EMPLOYMENT_STATUS_DEFAULT,
  EMPLOYMENT_STATUS_LABELS,
  GIAI_PHAP_LABELS,
  HIRING_METHOD_LABELS,
  JOB_RELEVANCE_LABELS,
  JOB_SEARCH_DURATION_LABELS,
  POST_GRAD_COURSE_LABELS,
  SEARCH_METHOD_LABELS,
  SOFT_SKILL_LABELS,
  TRAINING_FIT_LABELS,
  WORK_SECTOR_LABELS,
} from './legacy-report.constants';

export interface MajorTotalRow {
  majorCode: string;
  industryName: string;
  total: number;
  totalNu: number;
}

export interface RosterRow {
  tt: number | null;
  code: string;
  fullName: string;
  isFemale: boolean;
  cccd: string;
  majorCode: string;
  decisionNo: string;
  decisionDate: string;
  phone: string;
  email: string;
  hasResponse: boolean;
  note: string;
}

export interface ResponseRow {
  tt: number | null;
  code: string;
  fullName: string;
  dob: any;
  gender: string;
  cccd: string;
  majorCode: string;
  phone: string;
  email: string;
  city: string;
  salary: any;
  hiringDate: any;
  marked: number[];
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

export interface MajorInfo {
  code: string;
  name: string;
}

/** Bỏ dấu tiếng Việt, hạ thường, gộp khoảng trắng — dùng để so khớp tên ngành */
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

/** Chuyển 'dd/mm/yyyy' hoặc Date -> 'yyyy-mm-dd'. Trả về null nếu rỗng. */
function ddmmyyyyToIso(value: any): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s;
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

function cellLower(row: ExcelJS.Row, col: number): string {
  return cellText(row, col).toLowerCase();
}

@Injectable()
export class LegacyReportParserService {
  /** Đọc file "Báo cáo tổng hợp" (.xlsx) của hệ thống cũ -> dữ liệu thô */
  async parseWorkbook(buffer: Buffer): Promise<{
    majorTotals: MajorTotalRow[];
    roster: RosterRow[];
    responses: ResponseRow[];
  }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    const sheet1 = wb.getWorksheet('Mẫu báo cáo 1');
    const sheet2 = wb.getWorksheet('Mẫu báo cáo 2');
    const sheet3 = wb.getWorksheet('Mẫu báo cáo 3');
    if (!sheet1 || !sheet2 || !sheet3) {
      throw new Error('File không đúng định dạng "Báo cáo tổng hợp" (thiếu sheet Mẫu báo cáo 1/2/3)');
    }

    // Sheet 1: TT | Mã ngành | Tên ngành | Tổng số | Nữ | Phản hồi tổng | Phản hồi nữ — từ row 9, dừng ở dòng "TỔNG HỢP"
    const majorTotals: MajorTotalRow[] = [];
    for (let r = 9; r <= sheet1.rowCount + 1; r++) {
      const row = sheet1.getRow(r);
      const majorCode = cellText(row, 2);
      const industryName = cellText(row, 3);
      if (!majorCode && (!industryName || industryName.toUpperCase() === 'TỔNG HỢP')) break;
      if (!majorCode) continue;
      majorTotals.push({
        majorCode,
        industryName,
        total: Number(row.getCell(4).value) || 0,
        totalNu: Number(row.getCell(5).value) || 0,
      });
    }

    // Sheet 2: danh sách toàn bộ SV tốt nghiệp — từ row 8
    const roster: RosterRow[] = [];
    for (let r = 8; r <= sheet2.rowCount + 1; r++) {
      const row = sheet2.getRow(r);
      const code = cellText(row, 2);
      if (!code) break;
      roster.push({
        tt: Number(row.getCell(1).value) || null,
        code,
        fullName: cellText(row, 3),
        isFemale: cellLower(row, 4) === 'x',
        cccd: cellText(row, 5),
        majorCode: cellText(row, 6),
        decisionNo: cellText(row, 7),
        decisionDate: cellText(row, 8),
        phone: cellText(row, 9),
        email: cellText(row, 10),
        hasResponse: cellLower(row, 12) === 'x',
        note: cellText(row, 13),
      });
    }

    // Sheet 3: phản hồi khảo sát (64 cột) — từ row 9
    const responses: ResponseRow[] = [];
    for (let r = 9; r <= sheet3.rowCount + 1; r++) {
      const row = sheet3.getRow(r);
      const code = cellText(row, 2);
      if (!code) break;
      const marked: number[] = [];
      for (let c = 10; c <= 63; c++) {
        if (c === 19 || c === 27) continue;
        if (cellLower(row, c) === 'x') marked.push(c);
      }
      responses.push({
        tt: Number(row.getCell(1).value) || null,
        code,
        fullName: cellText(row, 3),
        dob: row.getCell(4).value,
        gender: cellText(row, 5),
        cccd: cellText(row, 6),
        majorCode: cellText(row, 7),
        phone: cellText(row, 8),
        email: cellText(row, 9),
        city: cellText(row, 19),
        salary: row.getCell(27).value,
        hiringDate: row.getCell(64).value,
        marked,
      });
    }

    return { majorTotals, roster, responses };
  }

  /** Giải mã 1 dòng "Mẫu báo cáo 3" thành `answers` JSON theo form 103 */
  decodeAnswers(resp: ResponseRow, majorInfo: MajorInfo): Record<string, any> {
    const marked = new Set(resp.marked);
    const answers: Record<string, any> = {};

    answers[ANSWER_KEYS.studentCode] = resp.code;
    answers[ANSWER_KEYS.fullName] = resp.fullName;
    answers[ANSWER_KEYS.gender] = resp.gender;
    answers[ANSWER_KEYS.dob] = ddmmyyyyToIso(resp.dob);
    answers[ANSWER_KEYS.cccd] = resp.cccd;
    answers[ANSWER_KEYS.majorCode] = majorInfo.code;
    answers[ANSWER_KEYS.majorName] = majorInfo.name;
    answers[ANSWER_KEYS.phone] = resp.phone;
    answers[ANSWER_KEYS.email] = resp.email;
    answers[ANSWER_KEYS.workLocation] = resp.city;

    // Cột 13/14 -> employmentStatus, mặc định "Đã có việc làm"
    let employmentStatus: string = EMPLOYMENT_STATUS_DEFAULT;
    for (const [col, label] of Object.entries(EMPLOYMENT_STATUS_LABELS)) {
      if (marked.has(Number(col))) {
        employmentStatus = label;
        break;
      }
    }
    answers[ANSWER_KEYS.employmentStatus] = employmentStatus;

    // Cột 15-51 chỉ decode khi "Đã có việc làm"
    if (employmentStatus === EMPLOYMENT_STATUS_DEFAULT) {
      for (const [col, label] of Object.entries(JOB_RELEVANCE_LABELS)) {
        if (marked.has(Number(col))) { answers[ANSWER_KEYS.jobRelevance] = label; break; }
      }
      for (const [col, label] of Object.entries(WORK_SECTOR_LABELS)) {
        if (marked.has(Number(col))) { answers[ANSWER_KEYS.workSector] = label; break; }
      }
      for (const [col, label] of Object.entries(JOB_SEARCH_DURATION_LABELS)) {
        if (marked.has(Number(col))) { answers[ANSWER_KEYS.jobSearchDuration] = label; break; }
      }
      for (const [col, label] of Object.entries(TRAINING_FIT_LABELS)) {
        if (marked.has(Number(col))) { answers[ANSWER_KEYS.trainingFit] = label; break; }
      }
      if (resp.salary != null && resp.salary !== '') {
        answers[ANSWER_KEYS.salary] = Number(resp.salary);
      }
      const hiringDateIso = ddmmyyyyToIso(resp.hiringDate);
      if (hiringDateIso) answers[ANSWER_KEYS.hiringDate] = hiringDateIso;
      for (const [col, label] of Object.entries(AVG_INCOME_LABELS)) {
        if (marked.has(Number(col))) { answers[ANSWER_KEYS.avgIncome] = label; break; }
      }
      const searchMethod: string[] = [];
      for (const [col, label] of Object.entries(SEARCH_METHOD_LABELS)) {
        if (marked.has(Number(col))) searchMethod.push(label);
      }
      if (searchMethod.length) answers[ANSWER_KEYS.searchMethod] = searchMethod;

      for (const [col, label] of Object.entries(HIRING_METHOD_LABELS)) {
        if (marked.has(Number(col))) { answers[ANSWER_KEYS.hiringMethod] = label; break; }
      }

      const softSkills: string[] = [];
      for (const [col, label] of Object.entries(SOFT_SKILL_LABELS)) {
        if (marked.has(Number(col))) softSkills.push(label);
      }
      if (softSkills.length) answers[ANSWER_KEYS.softSkills] = softSkills;
    }

    // Cột 52-62 luôn decode
    const postGradCourse: string[] = [];
    for (const [col, label] of Object.entries(POST_GRAD_COURSE_LABELS)) {
      if (marked.has(Number(col))) postGradCourse.push(label);
    }
    if (postGradCourse.length) answers[ANSWER_KEYS.postGradCourse] = postGradCourse;

    const giaiPhap: string[] = [];
    for (const [col, label] of Object.entries(GIAI_PHAP_LABELS)) {
      if (marked.has(Number(col))) giaiPhap.push(label);
    }
    if (giaiPhap.length) answers[ANSWER_KEYS.giaiPhap] = giaiPhap;

    return answers;
  }

  /** Nhóm theo mã ngành cũ, thử khớp với major hiện có trong hệ thống mới */
  buildMajorGroups(majorTotals: MajorTotalRow[], roster: RosterRow[], existingMajors: Major[]): MajorGroup[] {
    return majorTotals.map((mt) => {
      const responded = roster.filter((r) => r.majorCode === mt.majorCode && r.hasResponse).length;
      const matched = existingMajors.find((m) => namesMatch(m.name, mt.industryName));
      return {
        oldCode: mt.majorCode,
        industryName: mt.industryName,
        total: mt.total,
        totalNu: mt.totalNu,
        responded,
        matchedMajorId: matched?.id ?? null,
        suggestedCode: matched?.code ?? null,
        suggestedName: matched?.name ?? mt.industryName,
      };
    });
  }

  /** Tính lại các cột của "Mẫu báo cáo 1" từ `answers` đã decode, để admin so sánh trước khi xác nhận */
  buildPreviewStats(
    majorGroups: MajorGroup[],
    decoded: Array<{ majorCode: string; answers: Record<string, any> }>,
  ) {
    return majorGroups.map((mg) => {
      const rows = decoded.filter((r) => r.majorCode === mg.oldCode).map((r) => r.answers);
      const countEq = (key: string, label: string) => rows.filter((a) => a[key] === label).length;
      const countArr = (key: string, label: string) =>
        rows.filter((a) => Array.isArray(a[key]) && a[key].includes(label)).length;

      return {
        oldCode: mg.oldCode,
        industryName: mg.industryName,
        total: mg.total,
        totalNu: mg.totalNu,
        submitted: rows.length,
        submittedNu: rows.filter((a) => a[ANSWER_KEYS.gender] === 'Nữ').length,
        dungNganh: countEq(ANSWER_KEYS.jobRelevance, JOB_RELEVANCE_LABELS[10]),
        lienQuan: countEq(ANSWER_KEYS.jobRelevance, JOB_RELEVANCE_LABELS[11]),
        khongLienQuan: countEq(ANSWER_KEYS.jobRelevance, JOB_RELEVANCE_LABELS[12]),
        tiepTucHoc: countEq(ANSWER_KEYS.employmentStatus, EMPLOYMENT_STATUS_LABELS[13]),
        chuaCoVl: countEq(ANSWER_KEYS.employmentStatus, EMPLOYMENT_STATUS_LABELS[14]),
        kvNhaNuoc: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS[15]),
        kvTuNhan: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS[16]),
        kvTuTao: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS[17]),
        kvYNuocNgoai: countEq(ANSWER_KEYS.workSector, WORK_SECTOR_LABELS[18]),
      };
    });
  }
}
