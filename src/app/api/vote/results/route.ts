import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function ensureVoteTables() {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL DEFAULT '',
      voter_name TEXT NOT NULL DEFAULT '',
      choice_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vote_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
  await db.execute("INSERT OR IGNORE INTO vote_settings (key, value) VALUES ('answer_revealed', 'false')")
}

export async function GET() {
  await ensureVoteTables()
  const db = getDb()
  const [counts, names, settings] = await Promise.all([
    db.execute('SELECT choice_id, COUNT(*) as count FROM votes GROUP BY choice_id'),
    db.execute('SELECT choice_id, voter_name FROM votes ORDER BY created_at'),
    db.execute("SELECT value FROM vote_settings WHERE key = 'answer_revealed'"),
  ])

  const results: Record<number, number> = {}
  for (let i = 1; i <= 12; i++) results[i] = 0
  counts.rows.forEach((row) => {
    results[Number(row.choice_id)] = Number(row.count)
  })

  const voterNames: Record<number, string[]> = {}
  for (let i = 1; i <= 12; i++) voterNames[i] = []
  names.rows.forEach((row) => {
    const cid = Number(row.choice_id)
    const n = String(row.voter_name ?? '')
    if (n) voterNames[cid].push(n)
  })

  const total = Object.values(results).reduce((s, n) => s + n, 0)
  const answerRevealed = settings.rows[0]?.value === 'true'

  return NextResponse.json({ results, voterNames, total, answerRevealed })
}
