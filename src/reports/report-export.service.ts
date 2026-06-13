import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

/**
 * Xuất báo cáo Excel theo template công văn của hệ thống cũ (st.alumni-info-system):
 *  - Mẫu báo cáo 1: thống kê tình hình việc làm theo ngành (19 cột, header merge 3 tầng)
 *  - Mẫu báo cáo 2: danh sách sinh viên tốt nghiệp (15 cột)
 *  - Mẫu báo cáo 3: chi tiết phản hồi khảo sát — CỘT SINH ĐỘNG từ câu hỏi của form
 *    (câu trắc nghiệm → mỗi option 1 cột con đánh dấu x; câu tự luận → 1 cột ghi nguyên văn)
 * Font Times New Roman, border thin, dòng tổng hợp in đậm, khối chữ ký cuối sheet.
 */

export type ExportMau = 'mau01' | 'mau02' | 'mau03' | 'all';

/** Dữ liệu form động cho mẫu 3: câu hỏi từ formSnapshot + answers thô theo question.id */
export type DynamicSurveyData = {
  questions: any[];
  rows: Array<{
    studentCode: string; fullName: string; dob: string; gender: string;
    cccd: string; majorCode: string; phone: string; email: string;
    answers: Record<string, any>;
  }>;
};

const OTHER_PREFIX = '__other__';

// Câu hỏi cá nhân đã có cột cố định ở đầu mẫu 3 → bỏ qua khi sinh cột động
const PERSONAL_FIELD_KEYS = new Set([
  'student_code', 'fullname', 'gender', 'dob', 'citizen_identification',
  'industrycode', 'industryname', 'courseyear',
]);

const FONT = 'Times New Roman';
const THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, left: { style: 'thin' },
  bottom: { style: 'thin' }, right: { style: 'thin' },
};
const CENTER: Partial<ExcelJS.Alignment> = {
  horizontal: 'center', vertical: 'middle', wrapText: true,
};

function fmtDate(d: string): string {
  if (!d) return '';
  const t = new Date(d);
  if (isNaN(t.getTime())) return d;
  return `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
}

@Injectable()
export class ReportExportService {
  buildWorkbook(report: any, mau: ExportMau, dynamic?: DynamicSurveyData): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    const orgLine2 = (report?.currentUser?.facultyName ?? '').toUpperCase();
    const year = report?.reportMeta?.year ?? new Date().getFullYear();

    if (mau === 'mau01' || mau === 'all') this.addSheet1(wb, report, orgLine2, year);
    if (mau === 'mau02' || mau === 'all') this.addSheet2(wb, report, orgLine2, year);
    if ((mau === 'mau03' || mau === 'all') && dynamic) this.addSheet3(wb, dynamic, orgLine2, year);
    return wb;
  }

  // ── Helpers chung ──────────────────────────────────────────────

  /** 3 dòng đầu: tên Học viện / tên khoa / tiêu đề báo cáo */
  private addTitleBlock(ws: ExcelJS.Worksheet, orgLine2: string, title: string, lastCol: string) {
    ws.getCell('A1').value = 'HỌC VIỆN NÔNG NGHIỆP VIỆT NAM';
    ws.getCell('A2').value = orgLine2 || 'BAN QUẢN LÝ ĐÀO TẠO';
    ws.getCell('A3').value = title;
    ws.mergeCells('A1:D1');
    ws.mergeCells('A2:D2');
    ws.mergeCells(`A3:${lastCol}3`);
    ws.getCell('A1').style = { font: { name: FONT, size: 14 }, alignment: CENTER };
    ws.getCell('A2').style = { font: { name: FONT, size: 14, bold: true }, alignment: CENTER };
    ws.getCell('A3').style = { font: { name: FONT, size: 14, bold: true }, alignment: CENTER };
    ws.getRow(1).height = 20;
    ws.getRow(2).height = 20;
    ws.getRow(3).height = 25;
  }

  /** Border + căn giữa cho vùng bảng */
  private styleTable(ws: ExcelJS.Worksheet, fromRow: number, toRow: number, colCount: number) {
    for (let r = fromRow; r <= toRow; r++) {
      for (let c = 1; c <= colCount; c++) {
        const cell = ws.getRow(r).getCell(c);
        cell.border = THIN;
        cell.alignment = CENTER;
        if (!cell.font) cell.font = { name: FONT, size: 11 };
      }
    }
  }

  /** Header bảng: bold, wrap, size 12 */
  private styleHeader(ws: ExcelJS.Worksheet, rows: number[], colCount: number, lastNotBold = true) {
    const orderRow = rows[rows.length - 1]; // dòng (1) (2) (3)... không in đậm
    for (const r of rows) {
      ws.getRow(r).eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > colCount) return;
        cell.font = { name: FONT, size: 12, bold: !(lastNotBold && r === orderRow) };
        cell.alignment = CENTER;
      });
    }
  }

  /** Khối chữ ký dưới bảng */
  private addSignature(ws: ExcelJS.Worksheet, lastRow: number, fromCol: string, toCol: string, year: number, signLabel = 'TRƯỞNG KHOA') {
    const r = lastRow + 4;
    ws.getCell(`${fromCol}${r}`).value = `Hà Nội, ngày     tháng     năm ${year}`;
    ws.mergeCells(`${fromCol}${r}:${toCol}${r}`);
    ws.getCell(`${fromCol}${r}`).style = {
      font: { name: FONT, italic: true },
      alignment: { horizontal: 'center' },
    };
    ws.getCell(`${fromCol}${r + 1}`).value = signLabel;
    ws.mergeCells(`${fromCol}${r + 1}:${toCol}${r + 1}`);
    ws.getCell(`${fromCol}${r + 1}`).style = {
      font: { name: FONT, bold: true },
      alignment: { horizontal: 'center' },
    };
  }

  // ── Mẫu báo cáo 1 ──────────────────────────────────────────────

  private addSheet1(wb: ExcelJS.Workbook, report: any, orgLine2: string, year: number) {
    const ws = wb.addWorksheet('Mẫu báo cáo 1');
    const responses: any[] = report?.responseRows ?? [];
    const majorRows: any[] = report?.majorRows ?? [];

    ws.columns = [
      { width: 6 }, { width: 20 }, { width: 35 }, { width: 10 }, { width: 10 },
      { width: 10 }, { width: 10 }, { width: 12 }, { width: 15 }, { width: 15 },
      { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 20 },
    ] as any;

    this.addTitleBlock(ws, orgLine2, `BÁO CÁO TÌNH HÌNH VIỆC LÀM CỦA SINH VIÊN TỐT NGHIỆP NĂM ${year}`, 'S');

    // Header table rows 5-8
    ws.getRow(5).values = [
      'TT',
      'Mã ngành\n(Ghi theo mã ngành tuyển sinh theo thông tư số 24/2017/TT-BGDĐT)',
      'Tên ngành đào tạo',
      'Số sinh viên tốt nghiệp', '',
      'Số sinh viên phản hồi', '',
      'Tình hình việc làm', '', '', '', '',
      'Tỷ lệ sinh viên có việc làm/ Tổng số sinh viên phản hồi',
      'Tỷ lệ sinh viên có việc làm/ Tổng số sinh viên tốt nghiệp',
      'Khu vực làm việc', '', '', '',
      'Nơi làm việc\n(Tỉnh/TP)',
    ];
    ws.getRow(6).values = ['', '', '', '', '', '', '', 'Có việc làm', '', '', 'Tiếp tục học', 'Chưa có việc làm', '', '', '', '', '', '', ''];
    ws.getRow(7).values = [
      '', '', '', 'Tổng số', 'Nữ', 'Tổng số', 'Nữ',
      'Đúng ngành đào tạo', 'Liên quan đến ngành đào tạo', 'Không liên quan đến ngành đào tạo',
      '', '', '', '', 'Nhà nước', 'Tư nhân', 'Tự tạo việc làm', 'Có yếu tố nước ngoài', '',
    ];
    ws.getRow(8).values = Array.from({ length: 19 }, (_, i) => `(${i + 1})`);

    for (const range of [
      'A5:A7', 'B5:B7', 'C5:C7', 'D5:E6', 'F5:G6', 'H5:L5', 'M5:M7', 'N5:N7',
      'O5:R6', 'S5:S7', 'H6:J6', 'K6:K7', 'L6:L7',
    ]) ws.mergeCells(range);

    // Data: group responses theo majorCode
    const byMajor = new Map<string, any[]>();
    for (const r of responses) {
      const key = r.majorCode || 'CHUNG';
      if (!byMajor.has(key)) byMajor.set(key, []);
      byMajor.get(key)!.push(r);
    }

    let rowIdx = 9;
    let tt = 1;
    const sums = { total: 0, totalNu: 0, res: 0, resNu: 0, dn: 0, lq: 0, klq: 0, tth: 0, ccv: 0, nn: 0, tn: 0, tt: 0, nng: 0 };

    for (const [code, rows] of byMajor) {
      const majorInfo = majorRows.find((m: any) => m.majorCode === code);
      const dn = rows.filter((r) => r.dungNganh).length;
      const lq = rows.filter((r) => r.lienQuan).length;
      const klq = rows.filter((r) => r.khongLienQuan).length;
      const tth = rows.filter((r) => r.tiepTucHoc).length;
      const ccv = rows.filter((r) => r.chuaCoVl).length;
      const total = majorInfo?.total ?? rows.length;
      const totalNu = majorInfo?.totalNu ?? rows.filter((r) => r.gender === 'female').length;
      const res = rows.length;
      const resNu = rows.filter((r) => r.gender === 'female').length;
      // "Có việc làm" (cột M, N) = đúng ngành + liên quan + không liên quan — KHÔNG
      // gồm "tiếp tục học" (SV đang học, chưa phải đã đi làm)
      const coViec = dn + lq + klq;
      const cities = [...new Set(rows.map((r) => r.workLocation).filter(Boolean))].join('\n');

      ws.getRow(rowIdx).values = [
        tt++,
        code === 'CHUNG' ? '' : code,
        majorInfo?.majorName ?? rows[0]?.majorName ?? (code === 'CHUNG' ? 'Tổng hợp' : code),
        total, totalNu, res, resNu,
        dn, lq, klq, tth, ccv,
        res > 0 ? `${Math.round((coViec / res) * 10000) / 100}%` : '0%',
        total > 0 ? `${Math.round((coViec / total) * 10000) / 100}%` : '0%',
        rows.filter((r) => r.kvNhaNuoc).length,
        rows.filter((r) => r.kvTuNhan).length,
        rows.filter((r) => r.kvTuTao).length,
        rows.filter((r) => r.kvYNuocNgoai).length,
        cities,
      ];

      sums.total += total; sums.totalNu += totalNu; sums.res += res; sums.resNu += resNu;
      sums.dn += dn; sums.lq += lq; sums.klq += klq; sums.tth += tth; sums.ccv += ccv;
      sums.nn += rows.filter((r) => r.kvNhaNuoc).length;
      sums.tn += rows.filter((r) => r.kvTuNhan).length;
      sums.tt += rows.filter((r) => r.kvTuTao).length;
      sums.nng += rows.filter((r) => r.kvYNuocNgoai).length;
      rowIdx++;
    }

    // Dòng TỔNG HỢP
    const sumCoViec = sums.dn + sums.lq + sums.klq;
    ws.getRow(rowIdx).values = [
      tt, '', 'TỔNG HỢP',
      sums.total, sums.totalNu, sums.res, sums.resNu,
      sums.dn, sums.lq, sums.klq, sums.tth, sums.ccv,
      sums.res > 0 ? `${Math.round((sumCoViec / sums.res) * 10000) / 100}%` : '0%',
      sums.total > 0 ? `${Math.round((sumCoViec / sums.total) * 10000) / 100}%` : '0%',
      sums.nn, sums.tn, sums.tt, sums.nng, '',
    ];

    this.styleTable(ws, 5, rowIdx, 19);
    this.styleHeader(ws, [5, 6, 7, 8], 19);
    ws.getRow(rowIdx).eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT, size: 11, bold: true };
    });
    ws.getRow(5).height = 90;
    ws.getRow(6).height = 60;
    ws.getRow(7).height = 65;
    ws.getRow(8).height = 25;
    this.addSignature(ws, rowIdx, 'Q', 'S', year);
  }

  // ── Mẫu báo cáo 2 ──────────────────────────────────────────────

  private addSheet2(wb: ExcelJS.Workbook, report: any, orgLine2: string, year: number) {
    const ws = wb.addWorksheet('Mẫu báo cáo 2');
    const rows: any[] = report?.graduateRows ?? [];

    ws.columns = [
      { width: 6 }, { width: 12 }, { width: 25 }, { width: 6 }, { width: 30 },
      { width: 15 }, { width: 18 }, { width: 15 }, { width: 30 }, { width: 30 },
      { width: 20 }, { width: 12 }, { width: 15 }, { width: 25 }, { width: 20 },
    ] as any;

    this.addTitleBlock(ws, orgLine2, `DANH SÁCH SINH VIÊN TỐT NGHIỆP NĂM ${year}`, 'O');

    ws.getRow(5).values = [
      'TT', 'Mã sinh viên', 'Họ và tên', 'Nữ',
      'Số thẻ CCCD',
      'Mã ngành đào tạo',
      'Quyết định tốt nghiệp', '',
      'Thông tin liên hệ', '',
      'Hình thức khảo sát\n(Online, điện thoại, email, phỏng vấn...)',
      'Có phản hồi\n(Có phản hồi đánh dấu X)',
      'Ghi chú', 'Ngành', 'Khoa',
    ];
    ws.getRow(6).values = [
      '', '', '', '', '', '',
      'Số Quyết định', 'Ngày ký Quyết định',
      'Số điện thoại', 'Email\n(KHÔNG điền email do HVN cấp)',
      '', '', '', '', '',
    ];
    ws.getRow(7).values = Array.from({ length: 15 }, (_, i) => `(${i + 1})`);

    for (const range of [
      'A5:A6', 'B5:B6', 'C5:C6', 'D5:D6', 'E5:E6', 'F5:F6',
      'G5:H5', 'I5:J5', 'K5:K6', 'L5:L6', 'M5:M6', 'N5:N6', 'O5:O6',
    ]) ws.mergeCells(range);

    let rowIdx = 8;
    rows.forEach((s, i) => {
      ws.getRow(rowIdx).values = [
        i + 1,
        s.studentCode ?? '',
        s.fullName ?? '',
        s.gender === 'female' ? 'X' : '',
        s.cccd ? `${s.cccd} ` : '', // thêm space để Excel không hiển thị E+11
        s.majorCode ?? '',
        s.decision ?? '',
        fmtDate(s.certDate ?? ''),
        s.phone ? `${s.phone} ` : '',
        s.email ?? '',
        s.surveyMethod ?? 'Online',
        s.status === 'submitted' ? 'X' : '',
        s.note ?? '',
        s.majorName ?? '',
        s.facultyName ?? '',
      ];
      rowIdx++;
    });
    const lastRow = rowIdx - 1;

    // Cột CCCD + SĐT ép kiểu text để không mất số 0 đầu
    ws.getColumn(5).numFmt = '@';
    ws.getColumn(9).numFmt = '@';

    this.styleTable(ws, 5, Math.max(lastRow, 7), 15);
    this.styleHeader(ws, [5, 6, 7], 15);
    ws.getRow(5).height = 80;
    ws.getRow(6).height = 100;
    ws.getRow(7).height = 25;
    for (let r = 8; r <= lastRow; r++) ws.getRow(r).height = 30;
    this.addSignature(ws, Math.max(lastRow, 7), 'J', 'L', year);
  }


  // ── Mẫu báo cáo 3 — cột sinh động từ câu hỏi của form ─────────

  private addSheet3(wb: ExcelJS.Workbook, dynamic: DynamicSurveyData, orgLine2: string, year: number) {
    const ws = wb.addWorksheet('Mẫu báo cáo 3');
    const rows = dynamic.rows ?? [];

    // 9 cột thông tin sinh viên cố định (như mẫu công văn cũ)
    const FIXED = [
      { title: 'TT', width: 5 },
      { title: 'Mã sinh viên', width: 12 },
      { title: 'Họ và tên', width: 20 },
      { title: 'Ngày sinh', width: 12 },
      { title: 'Giới tính', width: 10 },
      { title: 'Số thẻ\nCCCD/CMTND', width: 15 },
      { title: 'Mã ngành đào tạo', width: 12 },
      { title: 'Điện thoại', width: 12 },
      { title: 'Email', width: 20 },
    ];

    // Sinh cột động từ câu hỏi (bỏ câu hỏi cá nhân đã có cột cố định)
    type QCol = { question: any; options: string[]; hasOther: boolean; span: number };
    const OPTION_TYPES = new Set(['radio', 'multiple-choice', 'checkbox', 'select', 'dropdown']);
    const qCols: QCol[] = (dynamic.questions ?? [])
      .filter((q) => !PERSONAL_FIELD_KEYS.has(q.reportFieldKey ?? ''))
      .map((q) => {
        const options: string[] = OPTION_TYPES.has(q.type)
          ? (q.options ?? []).map((o: any) => (typeof o === 'string' ? o : o?.label ?? '')).filter(Boolean)
          : [];
        const hasOther = options.length > 0 && !!q.allowOther;
        const span = options.length > 0 ? options.length + (hasOther ? 1 : 0) : 1;
        return { question: q, options, hasOther, span };
      });

    const totalCols = FIXED.length + qCols.reduce((s, c) => s + c.span, 0);

    // Column widths
    const widths: number[] = FIXED.map((f) => f.width);
    for (const qc of qCols) {
      if (qc.options.length > 0) for (let i = 0; i < qc.span; i++) widths.push(12);
      else widths.push(25); // câu tự luận: cột rộng hơn
    }
    ws.columns = widths.map((w) => ({ width: w })) as any;

    this.addTitleBlock(
      ws, orgLine2,
      `DANH SÁCH SINH VIÊN TỐT NGHIỆP NĂM ${year} PHẢN HỒI VỀ TÌNH HÌNH VIỆC LÀM`,
      ws.getColumn(Math.min(totalCols, 19)).letter,
    );

    // Header: row 5 = tiêu đề câu hỏi, row 6 = option, row 7 = (1)(2)(3)...
    let col = 1;
    for (const f of FIXED) {
      ws.getCell(5, col).value = f.title;
      ws.mergeCells(5, col, 6, col);
      col++;
    }
    for (const qc of qCols) {
      ws.getCell(5, col).value = qc.question.title ?? '';
      if (qc.options.length > 0) {
        ws.mergeCells(5, col, 5, col + qc.span - 1);
        qc.options.forEach((label, i) => { ws.getCell(6, col + i).value = label; });
        if (qc.hasOther) ws.getCell(6, col + qc.span - 1).value = 'Khác';
      } else {
        ws.mergeCells(5, col, 6, col);
      }
      col += qc.span;
    }
    for (let c = 1; c <= totalCols; c++) ws.getCell(7, c).value = `(${c})`;

    // Data rows
    let rowIdx = 8;
    rows.forEach((r, i) => {
      const row = ws.getRow(rowIdx);
      row.getCell(1).value = i + 1;
      row.getCell(2).value = r.studentCode ?? '';
      row.getCell(3).value = r.fullName ?? '';
      row.getCell(4).value = fmtDate(r.dob ?? '');
      row.getCell(5).value = r.gender === 'female' ? 'Nữ' : 'Nam';
      row.getCell(6).value = r.cccd ? `${r.cccd} ` : ''; // space chống E+11
      row.getCell(7).value = r.majorCode ?? '';
      row.getCell(8).value = r.phone ? `${r.phone} ` : '';
      row.getCell(9).value = r.email ?? '';

      let c = FIXED.length + 1;
      for (const qc of qCols) {
        const raw = r.answers?.[qc.question.id];
        if (qc.options.length > 0) {
          const values: string[] = Array.isArray(raw) ? raw.map(String) : raw != null ? [String(raw)] : [];
          const others = values.filter((v) => v.startsWith(OTHER_PREFIX)).map((v) => v.slice(OTHER_PREFIX.length).trim());
          qc.options.forEach((label, idx) => {
            if (values.includes(label)) row.getCell(c + idx).value = 'x';
          });
          // Giá trị "khác" (hoặc không khớp option nào) → cột cuối của nhóm
          const unmatched = values.filter((v) => !v.startsWith(OTHER_PREFIX) && !qc.options.includes(v));
          const otherText = [...others, ...unmatched].filter(Boolean).join(', ');
          if (otherText) row.getCell(c + qc.span - 1).value = qc.hasOther ? otherText : `${row.getCell(c + qc.span - 1).value ?? ''} ${otherText}`.trim();
        } else {
          row.getCell(c).value = this.formatAnswer(raw);
        }
        c += qc.span;
      }
      rowIdx++;
    });
    const lastRow = Math.max(rowIdx - 1, 7);

    ws.getColumn(6).numFmt = '@';
    ws.getColumn(8).numFmt = '@';

    this.styleTable(ws, 5, lastRow, totalCols);
    this.styleHeader(ws, [5, 6, 7], totalCols);
    ws.getRow(5).height = 80;
    ws.getRow(6).height = 90;
    ws.getRow(7).height = 25;
    for (let r = 8; r <= lastRow; r++) ws.getRow(r).height = 30;
    // Cột họ tên căn trái
    for (let r = 8; r <= lastRow; r++) {
      ws.getRow(r).getCell(3).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
    }

    const signFrom = ws.getColumn(Math.max(totalCols - 7, 2)).letter;
    const signTo = ws.getColumn(Math.max(totalCols - 1, 3)).letter;
    this.addSignature(ws, lastRow, signFrom, signTo, year);
  }

  /** Format câu trả lời tự luận: mảng → nối, object (địa chỉ) → nối field, còn lại → chuỗi */
  private formatAnswer(raw: any): string {
    if (raw == null) return '';
    if (Array.isArray(raw)) return raw.map((v) => this.formatAnswer(v)).filter(Boolean).join(', ');
    if (typeof raw === 'object') return Object.values(raw).map(String).filter(Boolean).join(', ');
    const s = String(raw);
    return s.startsWith(OTHER_PREFIX) ? s.slice(OTHER_PREFIX.length).trim() : s;
  }
}
