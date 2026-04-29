const { createClient } = require('@libsql/client')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

function getClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  if (tursoUrl) {
    return createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
  }
  const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data')
  fs.mkdirSync(DB_DIR, { recursive: true })
  return createClient({ url: `file:${path.join(DB_DIR, 'wedding.db')}` })
}

const client = getClient()

async function main() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploader_name TEXT NOT NULL DEFAULT 'ゲスト',
      message TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      file_size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const adminUser = process.env.ADMIN_USER || 'admin'
  const adminPass = process.env.ADMIN_PASS || 'wedding2024'
  const hash = bcrypt.hashSync(adminPass, 10)

  const existing = await client.execute({
    sql: 'SELECT id FROM admins WHERE username = ?',
    args: [adminUser],
  })

  if (existing.rows.length === 0) {
    await client.execute({
      sql: 'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      args: [adminUser, hash],
    })
    console.log(`✅ 管理者アカウント作成: ${adminUser} / ${adminPass}`)
  } else {
    await client.execute({
      sql: 'UPDATE admins SET password_hash = ? WHERE username = ?',
      args: [hash, adminUser],
    })
    console.log(`✅ 管理者パスワード更新: ${adminUser}`)
  }

  console.log('✅ データベース初期化完了')
  client.close()
}

main().catch((err) => {
  console.error('初期化エラー:', err)
  process.exit(1)
})
