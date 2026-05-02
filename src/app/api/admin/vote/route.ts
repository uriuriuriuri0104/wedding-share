import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = getDb()
  const [settings, countResult] = await Promise.all([
    db.execute("SELECT value FROM vote_settings WHERE key = 'answer_revealed'"),
    db.execute('SELECT COUNT(*) as count FROM votes'),
  ])
  return NextResponse.json({
    answerRevealed: settings.rows[0]?.value === 'true',
    total: Number(countResult.rows[0]?.count ?? 0),
  })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { action } = await req.json()
  const db = getDb()

  if (action === 'reveal') {
    await db.execute("INSERT OR REPLACE INTO vote_settings (key, value) VALUES ('answer_revealed', 'true')")
    return NextResponse.json({ success: true, answerRevealed: true })
  }
  if (action === 'hide') {
    await db.execute("INSERT OR REPLACE INTO vote_settings (key, value) VALUES ('answer_revealed', 'false')")
    return NextResponse.json({ success: true, answerRevealed: false })
  }
  if (action === 'reset') {
    await db.execute('DELETE FROM votes')
    await db.execute("INSERT OR REPLACE INTO vote_settings (key, value) VALUES ('answer_revealed', 'false')")
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '無効なアクション' }, { status: 400 })
}
