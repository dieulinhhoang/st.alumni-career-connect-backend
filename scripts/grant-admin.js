/**
 * Cấp / thu quyền admin cho tài khoản trên hệ thống.
 *
 * Cách dùng (chạy trong thư mục backend):
 *   npm run grant-admin                      → liệt kê user hiện có
 *   npm run grant-admin -- CB001             → cấp admin cho user có mã CB001
 *   npm run grant-admin -- CB001 revoke      → thu quyền admin
 *
 * Tham số tìm user theo thứ tự: mã cán bộ (code) → sso_id → email → id.
 * Lưu ý: người dùng phải ĐĂNG NHẬP SSO ÍT NHẤT 1 LẦN để có tài khoản
 * trong hệ thống trước khi cấp quyền.
 *
 * Script đọc thông tin DB từ file .env (DB_HOST, DB_PORT, DB_USERNAME,
 * DB_PASSWORD, DB_DATABASE) — không cần build, không cần dừng backend.
 */
require('dotenv/config');
const mysql = require('mysql2/promise');

const ADMIN_ROLE_NAME = 'Quản trị hệ thống';

async function main() {
  const args = process.argv.slice(2).filter(Boolean);
  // Chấp nhận cả "--revoke" lẫn "revoke" (npm trên Windows đôi khi nuốt cờ "--")
  const revoke = args.some((a) => a.replace(/^-+/, '').toLowerCase() === 'revoke');
  const target = args.find((a) => !a.startsWith('--') && a.toLowerCase() !== 'revoke');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
  });

  try {
    if (!target) {
      const [rows] = await db.query(
        `SELECT id, code, full_name, email, type, status, is_admin
         FROM users ORDER BY is_admin DESC, id ASC LIMIT 50`,
      );
      console.log('\nCách dùng: npm run grant-admin -- <mã cán bộ | sso_id | email | id> [revoke]\n');
      if (rows.length === 0) {
        console.log('Chưa có user nào trong hệ thống.');
        console.log('→ Người cần cấp quyền phải đăng nhập SSO 1 lần trước, rồi chạy lại lệnh này.');
        return;
      }
      console.log('User hiện có (tối đa 50):');
      console.table(rows.map((u) => ({
        id: u.id, 'mã': u.code ?? '', 'họ tên': u.full_name ?? '', email: u.email ?? '',
        'loại': u.type, 'trạng thái': u.status, admin: u.is_admin ? '✔' : '',
      })));
      return;
    }

    // Toàn chữ số → tìm chính xác theo id; ngược lại tìm theo mã / sso_id / email
    const [users] = /^\d+$/.test(target)
      ? await db.query(`SELECT id, code, sso_id, full_name, is_admin, status FROM users WHERE id = ? LIMIT 2`, [Number(target)])
      : await db.query(
          `SELECT id, code, sso_id, full_name, is_admin, status FROM users
           WHERE code = ? OR sso_id = ? OR email = ?
           LIMIT 2`,
          [target, target, target],
        );

    if (users.length === 0) {
      console.error(`✖ Không tìm thấy user "${target}" (đã tìm theo mã, sso_id, email, id).`);
      console.error('→ Người này cần đăng nhập SSO 1 lần để hệ thống tạo tài khoản, rồi chạy lại lệnh.');
      process.exitCode = 1;
      return;
    }
    if (users.length > 1) {
      console.error(`✖ Có nhiều hơn 1 user khớp "${target}" — dùng id cụ thể thay thế.`);
      process.exitCode = 1;
      return;
    }

    const user = users[0];

    if (revoke) {
      await db.query(`UPDATE users SET is_admin = 0, type = 'officer' WHERE id = ?`, [user.id]);
      const [roles] = await db.query(`SELECT id FROM roles WHERE name = ? OR code = 'admin' LIMIT 1`, [ADMIN_ROLE_NAME]);
      if (roles.length > 0) {
        await db.query(`DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`, [user.id, roles[0].id]);
      }
      console.log(`✔ Đã THU quyền admin của: ${user.full_name ?? user.sso_id} (id ${user.id})`);
      return;
    }

    await db.query(
      `UPDATE users SET is_admin = 1, status = 'active', type = 'admin' WHERE id = ?`,
      [user.id],
    );

    // Gắn thêm role "Quản trị hệ thống" nếu có (để hiển thị vai trò; quyền thật đến từ is_admin)
    const [roles] = await db.query(`SELECT id FROM roles WHERE name = ? OR code = 'admin' LIMIT 1`, [ADMIN_ROLE_NAME]);
    if (roles.length > 0) {
      const [existing] = await db.query(
        `SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?`,
        [user.id, roles[0].id],
      );
      if (existing.length === 0) {
        await db.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [user.id, roles[0].id]);
      }
    }

    console.log(`✔ Đã cấp quyền ADMIN cho: ${user.full_name ?? user.sso_id} (id ${user.id}, mã ${user.code ?? '—'})`);
    console.log('→ Người này đăng xuất / đăng nhập lại để quyền mới có hiệu lực.');
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error('✖ Lỗi:', e.message);
  process.exit(1);
});
