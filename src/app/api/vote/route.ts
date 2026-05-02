import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

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

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || '127.0.0.1'
}

export async function GET(req: NextRequest) {
  await ensureVoteTables()
  const ip = getClientIP(req)
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT choice_id FROM votes WHERE ip_address = ?',
    args: [ip],
  })
  if (result.rows.length > 0) {
    return NextResponse.json({ voted: true, choiceId: Number(result.rows[0].choice_id) })
  }
  return NextResponse.json({ voted: false })
}

export async function POST(req: NextRequest) {
  await ensureVoteTables()
  const ip = getClientIP(req)
  const db = getDb()

  const body = await req.json()
  const choiceId = Number(body.choiceId)
  if (!choiceId || choiceId < 1 || choiceId > 12) {
    return NextResponse.json({ error: '無効な選択です' }, { status: 400 })
  }

  try {
    await db.execute({
      sql: 'INSERT INTO votes (id, choice_id, ip_address) VALUES (?, ?, ?)',
      args: [uuidv4(), choiceId, ip],
    })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('UNIQUE') || msg.includes('constraint')) {
      return NextResponse.json({ error: 'すでに投票済みです' }, { status: 409 })
    }
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
