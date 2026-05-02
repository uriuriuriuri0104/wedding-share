import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

async function ensureVoteTables() {
  const db = getDb()

  // マイグレーション: device_id スキーマ → ip_address スキーマ
  try {
    const tableInfo = await db.execute('PRAGMA table_info(votes)')
    const cols = tableInfo.rows.map(r => String(r.name))
    if (cols.includes('device_id') && !cols.includes('ip_address')) {
      await db.execute('DROP TABLE IF EXISTS votes_old')
      await db.execute('ALTER TABLE votes RENAME TO votes_old')
      await db.execute(`
        CREATE TABLE votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip_address TEXT NOT NULL DEFAULT '',
          voter_name TEXT NOT NULL DEFAULT '',
          choice_id INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `)
      await db.execute('DROP TABLE votes_old')
    }
  } catch {}

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

export async function GET(req: NextRequest) {
  await ensureVoteTables()
  const ip = getIp(req)
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT choice_id, voter_name FROM votes WHERE ip_address = ?',
    args: [ip],
  })
  if (result.rows.length > 0) {
    return NextResponse.json({
      voted: true,
      choiceId: Number(result.rows[0].choice_id),
      voterName: String(result.rows[0].voter_name ?? ''),
    })
  }
  return NextResponse.json({ voted: false })
}

export async function POST(req: NextRequest) {
  await ensureVoteTables()
  const db = getDb()
  const ip = getIp(req)
  const body = await req.json()
  const choiceId = Number(body.choiceId)
  const voterName = String(body.voterName ?? '').trim()

  if (!choiceId || choiceId < 1 || choiceId > 12) {
    return NextResponse.json({ error: '無効な選択です' }, { status: 400 })
  }
  if (!voterName) {
    return NextResponse.json({ error: 'お名前を入力してください' }, { status: 400 })
  }

  const existing = await db.execute({
    sql: 'SELECT id FROM votes WHERE ip_address = ?',
    args: [ip],
  })
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'すでに投票済みです' }, { status: 409 })
  }

  await db.execute({
    sql: 'INSERT INTO votes (ip_address, voter_name, choice_id) VALUES (?, ?, ?)',
    args: [ip, voterName, choiceId],
  })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
  await ensureVoteTables()
  const db = getDb()
  const ip = getIp(req)
  const body = await req.json()
  const choiceId = Number(body.choiceId)

  if (!choiceId || choiceId < 1 || choiceId > 12) {
    return NextResponse.json({ error: '無効な選択です' }, { status: 400 })
  }

  const result = await db.execute({
    sql: 'UPDATE votes SET choice_id = ? WHERE ip_address = ?',
    args: [choiceId, ip],
  })
  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: '投票が見つかりません' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
