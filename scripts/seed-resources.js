/**
 * Nạp sẵn danh sách tài nguyên (resources) và các hành động (actions) mặc định
 * cho trang Phân quyền. Dùng khi triển khai mới hoặc khi bảng resources bị thiếu.
 *
 * Cách dùng (chạy trong thư mục backend):
 *   npm run seed-resources          → nạp/cập nhật tài nguyên mặc định
 *   npm run seed-resources -- --list → chỉ xem tài nguyên hiện có, không ghi
 *
 * Idempotent & an toàn: CHỈ thêm tài nguyên còn thiếu. Tài nguyên đã tồn tại
 * (kể cả khi tên/actions đã được chỉnh tay trong trang Phân quyền) sẽ được giữ
 * nguyên, không ghi đè. Không đụng tới role_resources đã gán.
 *
 * Đọc thông tin DB từ .env (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE).
 * Không cần build, không cần dừng backend.
 */
require('dotenv/config');
const mysql = require('mysql2/promise');

// Nguồn chuẩn của tài nguyên — phải khớp với seed.service.ts
const DEFAULT_RESOURCES = [
  { code: 'students',    name: 'Quản lý sinh viên',            actions: ['read', 'create', 'update', 'delete'] },
  { code: 'surveys',     name: 'Quản lý khảo sát',             actions: ['read', 'create', 'update', 'delete', 'export'] },
  { code: 'enterprises', name: 'Quản lý doanh nghiệp đối tác', actions: ['read', 'create', 'update', 'delete'] },
  { code: 'jobs',        name: 'Quản lý việc làm',             actions: ['read', 'create', 'update', 'delete'] },
  { code: 'users',       name: 'Quản lý người dùng',           actions: ['read', 'create', 'update', 'delete'] },
  { code: 'roles',       name: 'Quản lý vai trò',              actions: ['read', 'create', 'update', 'delete'] },
  { code: 'reports',     name: 'Quản lý báo cáo',              actions: ['read', 'export'] },
  { code: 'graduation',  name: 'Quản lý tốt nghiệp',           actions: ['read', 'create', 'update'] },
];

async function main() {
  const listOnly = process.argv.slice(2).some((a) => a.replace(/^-+/, '').toLowerCase() === 'list');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
  });

  try {
    const [existing] = await db.query(`SELECT code, name, actions FROM resources`);
    const byCode = new Map(existing.map((r) => [r.code, r]));

    if (listOnly) {
      console.log('\nTài nguyên hiện có:');
      if (existing.length === 0) console.log('  (chưa có tài nguyên nào)');
      else console.table(existing.map((r) => ({ 'mã': r.code, 'tên': r.name, actions: r.actions })));
      return;
    }

    let added = 0, skipped = 0;
    for (const r of DEFAULT_RESOURCES) {
      const actions = r.actions.join(','); // cột simple-array lưu dạng CSV
      if (byCode.has(r.code)) {
        skipped++;
        continue;
      }
      await db.query(`INSERT INTO resources (code, name, actions) VALUES (?, ?, ?)`, [r.code, r.name, actions]);
      console.log(`  + thêm : ${r.code} (${r.name})`);
      added++;
    }

    console.log(`\n✔ Xong: ${added} thêm mới, ${skipped} đã có (giữ nguyên).`);
    console.log('→ Tài khoản admin luôn có toàn quyền; cán bộ khoa cần vào trang Phân quyền để gán action cho từng vai trò.');
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error('✖ Lỗi:', e.message);
  process.exit(1);
});
