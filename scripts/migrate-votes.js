const { createClient } = require('@libsql/client')
const path = require('path')
const fs = require('fs')

function getClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  if (tursoUrl) {
    console.log('Turso リモートDBに接続中...')
    return createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
  }
  console.log('ローカルSQLiteに接続中...')
  const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data')
  fs.mkdirSync(DB_DIR, { recursive: true })
  return createClient({ url: `file:${path.join(DB_DIR, 'wedding.db')}` })
}

const client = getClient()

async function main() {
  console.log('votes テーブルのマイグレーション開始...')

  const tableInfo = await client.execute('PRAGMA table_info(votes)')
  console.log('現在のカラム:')
  tableInfo.rows.forEach(row => {
    console.log(`  ${row.name} ${row.type} ${row.notnull ? 'NOT NULL' : 'NULL'} default=${row.dflt_value}`)
  })

  const cols = tableInfo.rows.map(r => String(r.name))
  if (!cols.includes('device_id') && cols.includes('ip_address')) {
    console.log('既にマイグレーション済みです。')
    client.close()
    return
  }

  const existing = await client.execute('SELECT COUNT(*) as count FROM votes')
  console.log(`既存の投票数: ${existing.rows[0].count}`)

  await client.execute('DROP TABLE IF EXISTS votes_old')
  await client.execute('ALTER TABLE votes RENAME TO votes_old')
  await client.execute(`
    CREATE TABLE votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL DEFAULT '',
      voter_name TEXT NOT NULL DEFAULT '',
      choice_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  await client.execute('DROP TABLE votes_old')

  console.log('マイグレーション完了。新しいスキーマ:')
  const newInfo = await client.execute('PRAGMA table_info(votes)')
  newInfo.rows.forEach(row => {
    console.log(`  ${row.name} ${row.type} ${row.notnull ? 'NOT NULL' : 'NULL'} default=${row.dflt_value}`)
  })

  client.close()
}

main().catch((err) => {
  console.error('マイグレーションエラー:', err)
  process.exit(1)
})
