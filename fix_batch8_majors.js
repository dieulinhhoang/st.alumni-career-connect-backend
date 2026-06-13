require('dotenv').config();
const mysql = require('mysql2/promise');

const TI_MAP = {
  2: { id: 11, code: 'MMTTDL', name: 'Mạng máy tính & Truyền dữ liệu' },
  3: { id: 12, code: 'KHDLTTNT', name: 'Khoa học dữ liệu & Trí tuệ nhân tạo' },
};

// studentId -> old training_industry_id (period-10 record order)
const STUDENT_TI = {
  40: 2, 41: 3, 42: 2, 43: 3, 44: 3, 45: 2, 46: 2, 47: 2, 48: 2, 49: 2, 50: 2, 51: 2, 52: 2,
};

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'survey_alumni_v3',
  });

  await conn.query(
    'INSERT INTO major (id, name, status, faculty_id, code) VALUES (11, ?, 1, 1, ?), (12, ?, 1, 1, ?)',
    [TI_MAP[2].name, TI_MAP[2].code, TI_MAP[3].name, TI_MAP[3].code],
  );

  for (const [studentId, ti] of Object.entries(STUDENT_TI)) {
    const major = TI_MAP[ti];
    await conn.query('UPDATE student SET training_industry_id=? WHERE id=?', [major.id, Number(studentId)]);

    const [rows] = await conn.query('SELECT code FROM student WHERE id=?', [Number(studentId)]);
    const code = rows[0].code;
    const [resp] = await conn.query('SELECT id, answers FROM alumni_batch_responses WHERE batch_id=8 AND student_id=?', [code]);
    const answers = resp[0].answers;
    answers.lbxfns = major.code;
    answers.ni0dcj = major.name;
    await conn.query('UPDATE alumni_batch_responses SET answers=? WHERE id=?', [JSON.stringify(answers), resp[0].id]);
  }

  console.log('Done.');
  await conn.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
