/**
 * Sinh script SQL idempotent bổ sung MỌI cột còn thiếu cho TẤT CẢ bảng trên server.
 * Nguồn chuẩn: DB local (DB_SYNC=true → khớp entity). Đọc information_schema của local,
 * với mỗi cột sinh 1 block "ADD COLUMN nếu chưa có" (kiểm tra qua information_schema).
 * Vì mỗi coldef mô tả cột đang tồn tại ở local nên cú pháp chắc chắn hợp lệ.
 *
 * Chạy: node scripts/gen-missing-columns.js > scripts/fix-all-missing-columns.sql
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

function quoteDefault(type, def, extra) {
  const e = (extra || '').toLowerCase();
  // Hàm/biểu thức (CURRENT_TIMESTAMP, DEFAULT_GENERATED) → KHÔNG quote
  if (e.includes('default_generated') || /^current_timestamp/i.test(def) || /^\(/.test(def)) {
    return def;
  }
  // Literal → quote, escape nháy đơn
  return `'${String(def).replace(/'/g, "''")}'`;
}

function synthDefault(dataType, columnType) {
  const t = dataType.toLowerCase();
  if (['int', 'bigint', 'tinyint', 'smallint', 'mediumint', 'decimal', 'float', 'double', 'bit'].includes(t)) return ' DEFAULT 0';
  if (t === 'enum') {
    const m = columnType.match(/^enum\((.*)\)$/i);
    if (m) return ` DEFAULT ${m[1].split(',')[0]}`; // phần tử enum đầu (đã có sẵn nháy)
    return '';
  }
  if (['varchar', 'char'].includes(t)) return " DEFAULT ''";
  if (['datetime', 'timestamp'].includes(t)) return ' DEFAULT CURRENT_TIMESTAMP';
  if (t === 'date') return " DEFAULT '1970-01-01'";
  return ''; // text/json/blob NOT NULL không default — hiếm, để nguyên
}

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
  });

  const [cols] = await c.query(
    `SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, COLUMN_TYPE, DATA_TYPE,
            IS_NULLABLE, COLUMN_DEFAULT, EXTRA
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [process.env.DB_DATABASE],
  );
  // Chỉ base table (bỏ view)
  const [tbls] = await c.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [process.env.DB_DATABASE],
  );
  const baseTables = new Set(tbls.map((t) => t.TABLE_NAME));
  await c.end();

  const out = [];
  out.push('-- Script idempotent bổ sung MỌI cột còn thiếu cho tất cả bảng.');
  out.push('-- Sinh tự động từ schema local (khớp entity). Chỉ ADD nếu cột chưa có → chạy lại nhiều lần vô hại.');
  out.push('-- KHÔNG sửa/xoá cột nào đang có. Chạy: mysql -u root -p <DB_SERVER> < scripts/fix-all-missing-columns.sql');
  out.push('');

  let count = 0;
  let currentTable = null;
  for (const col of cols) {
    if (!baseTables.has(col.TABLE_NAME)) continue;
    const extra = (col.EXTRA || '').toLowerCase();
    // Bỏ cột auto_increment (PK — bảng đã tồn tại nên chắc chắn có) và cột generated
    if (extra.includes('auto_increment')) continue;
    if (extra.includes('virtual generated') || extra.includes('stored generated')) continue;

    if (col.TABLE_NAME !== currentTable) {
      currentTable = col.TABLE_NAME;
      out.push(`-- ===== ${currentTable} =====`);
      // @t: bảng có tồn tại trên server không? (thiếu nguyên bảng → bỏ qua, không làm sập script)
      out.push(
        `SET @t := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='${currentTable}');`,
      );
    }

    // Dựng coldef
    let def = col.COLUMN_TYPE;
    const notNull = col.IS_NULLABLE === 'NO';
    def += notNull ? ' NOT NULL' : ' NULL';

    if (col.COLUMN_DEFAULT !== null) {
      def += ` DEFAULT ${quoteDefault(col.DATA_TYPE, col.COLUMN_DEFAULT, col.EXTRA)}`;
    } else if (notNull) {
      // NOT NULL không default: bảng server có dữ liệu → phải có default để ALTER không lỗi
      def += synthDefault(col.DATA_TYPE, col.COLUMN_TYPE);
    }
    // ON UPDATE CURRENT_TIMESTAMP
    if (extra.includes('on update current_timestamp')) def += ' ON UPDATE CURRENT_TIMESTAMP';

    const t = col.TABLE_NAME;
    const cn = col.COLUMN_NAME;
    const addSql = `ALTER TABLE \\\`${t}\\\` ADD COLUMN \\\`${cn}\\\` ${def.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}`;
    out.push(
      `SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='${t}' AND COLUMN_NAME='${cn}');`,
    );
    out.push(`SET @s := IF(@t=1 AND @c=0, "${addSql}", 'SELECT 1');`);
    out.push('PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;');
    count++;
  }

  out.push('');
  out.push(`-- Tổng cộng kiểm tra ${count} cột trên ${baseTables.size} bảng.`);
  process.stdout.write(out.join('\n') + '\n');
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
