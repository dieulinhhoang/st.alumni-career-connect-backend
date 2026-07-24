require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('fs'); const path = require('path');
const BASE = 'http://127.0.0.1:8000';
const token = jwt.sign({ sub: 1, isAdmin: true, permissions: ['*'], name: 'Tester' }, process.env.JWT_SECRET, { expiresIn: '1h' });
(async () => {
  const exp = await fetch(`${BASE}/alumni/legacy-import/export?batchId=11`, { headers: { Authorization: `Bearer ${token}` } });
  console.log('EXPORT status:', exp.status, '| ct:', exp.headers.get('content-type'));
  console.log('EXPORT cd:', exp.headers.get('content-disposition'));
  if (exp.status !== 200) { console.log(await exp.text()); return; }
  const buf = Buffer.from(await exp.arrayBuffer());
  console.log('EXPORT size:', buf.length, 'bytes');
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  console.log('SHEET rows(incl header):', ws.rowCount, '| headers:', ws.getRow(1).values.slice(1,6).join(' | '));
  console.log('DATA row2 :', [1,2,3,4,11].map(c=>ws.getRow(2).getCell(c).value).join(' | '));

  const mysql = require('mysql2/promise');
  const c = await mysql.createConnection({host:process.env.DB_HOST,port:process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});
  const [forms] = await c.query(`SELECT id,name FROM forms WHERE is_system=1 ORDER BY id LIMIT 1`);
  await c.end();
  const formId = forms[0]?.id;
  const fd = new FormData();
  fd.append('file', new Blob([buf]), 'export_test.xlsx');
  fd.append('formId', String(formId));
  const prev = await fetch(`${BASE}/alumni/legacy-import/preview`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  const pj = await prev.json();
  console.log('\nPREVIEW status:', prev.status, '| formId:', formId);
  console.log('PREVIEW roster:', pj.roster?.length, '| responses:', pj.responses?.length, '| majorGroups:', pj.majorGroups?.length);
  const r0 = pj.roster?.[0];
  console.log('PREVIEW sample:', r0?.code, '|', r0?.fullName, '| answer keys:', Object.keys(r0?.answers||{}).length);
})().catch(e=>console.error('ERR', e.message));
