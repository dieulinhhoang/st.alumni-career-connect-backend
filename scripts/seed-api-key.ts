/**
 * Tạo 1 test API key và insert thẳng vào DB.
 * Chạy: npx ts-node -r tsconfig-paths/register scripts/seed-api-key.ts
 */
import { createHash, randomBytes } from 'crypto'
import * as mysql from 'mysql2/promise'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const raw    = randomBytes(32).toString('hex')
  const hash   = createHash('sha256').update(raw).digest('hex')
  const suffix = raw.slice(-8)

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'alumni_career_connect',
  })

  await conn.execute(
    `INSERT INTO api_keys (name, description, key_hash, key_suffix, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, NOW())`,
    ['test-key', 'Dev test key', hash, suffix],
  )

  await conn.end()

  console.log('\n✅ Test API key created!\n')
  console.log('Raw key (copy this):')
  console.log('\x1b[32m' + raw + '\x1b[0m')
  console.log('\nSuffix:', suffix)
  console.log('\nDùng trong header:')
  console.log(`  X-Api-Key: ${raw}`)
  console.log('\nTest curl:')
  console.log(`  curl -H "X-Api-Key: ${raw}" http://localhost:3000/external-api/alumni-career`)
}

main().catch(console.error)
