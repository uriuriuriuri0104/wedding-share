import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

async function ensureVoteTables() {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      choice_id INTEGER NOT NULL,
      device_id TEXT NOT NULL DEFAULT '',
      voter_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  try { await db.execute("ALTER TABLE votes ADD COLUMN device_id TEXT NOT NULL DEFAULT ''") } catch {}
  try { await db.execute("ALTER TABLE votes ADD COLUMN voter_name TEXT NOT NULL DEFAULT ''") } catch {}
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
  const deviceId = req.nextUrl.searchParams.get('deviceId')
  if (!deviceId) return NextResponse.json({ voted: false })
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT choice_id, voter_name FROM votes WHERE device_id = ?',
    args: [deviceId],
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
  const body = await req.json()
  const choiceId = Number(body.choiceId)
  const deviceId = String(body.deviceId ?? '').trim()
  const voterName = String(body.voterName ?? '').trim()

  if (!choiceId || choiceId < 1 || choiceId > 12) {
    return NextResponse.json({ error: '無効な選択です' }, { status: 400 })
  }
  if (!deviceId) {
    return NextResponse.json({ error: '端末IDが必要です' }, { status: 400 })
  }
  if (!voterName) {
    return NextResponse.json({ error: 'お名前を入力してください' }, { status: 400 })
  }

  const existing = await db.execute({
    sql: 'SELECT id FROM votes WHERE device_id = ?',
    args: [deviceId],
  })
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'すでに投票済みです' }, { status: 409 })
  }

  await db.execute({
    sql: 'INSERT INTO votes (id, choice_id, device_id, voter_name) VALUES (?, ?, ?, ?)',
    args: [uuidv4(), choiceId, deviceId, voterName],
  })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
  await ensureVoteTables()
  const db = getDb()
  const body = await req.json()
  const choiceId = Number(body.choiceId)
  const deviceId = String(body.deviceId ?? '').trim()

  if (!choiceId || choiceId < 1 || choiceId > 12) {
    return NextResponse.json({ error: '無効な選択です' }, { status: 400 })
  }
  if (!deviceId) {
    return NextResponse.json({ error: '端末IDが必要です' }, { status: 400 })
  }

  const result = await db.execute({
    sql: 'UPDATE votes SET choice_id = ? WHERE device_id = ?',
    args: [choiceId, deviceId],
  })
  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: '投票が見つかりません' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
