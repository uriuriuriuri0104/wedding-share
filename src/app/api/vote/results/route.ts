import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function ensureVoteTables() {
  const db = getDb()
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      choice_id INTEGER NOT NULL,
      ip_address TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS vote_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
  await db.execute("INSERT OR IGNORE INTO vote_settings (key, value) VALUES ('answer_revealed', 'false')")
}

export async function GET() {
  await ensureVoteTables()
  const db = getDb()
  const [counts, settings] = await Promise.all([
    db.execute('SELECT choice_id, COUNT(*) as count FROM votes GROUP BY choice_id'),
    db.execute("SELECT value FROM vote_settings WHERE key = 'answer_revealed'"),
  ])

  const results: Record<number, number> = {}
  for (let i = 1; i <= 12; i++) results[i] = 0
  counts.rows.forEach((row) => {
    results[Number(row.choice_id)] = Number(row.count)
  })

  const total = Object.values(results).reduce((s, n) => s + n, 0)
  const answerRevealed = settings.rows[0]?.value === 'true'

  return NextResponse.json({ results, total, answerRevealed })
}
