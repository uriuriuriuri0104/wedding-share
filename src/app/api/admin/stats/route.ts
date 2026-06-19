import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    await initDb()
    const db = getDb()

    const [views, todayViews, votes] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM page_views'),
      db.execute("SELECT COUNT(*) as count FROM page_views WHERE date(created_at, '+9 hours') = date('now', '+9 hours')"),
      db.execute('SELECT COUNT(*) as count FROM votes'),
    ])

    return NextResponse.json({
      totalViews: Number(views.rows[0].count),
      todayViews: Number(todayViews.rows[0].count),
      totalVotes: Number(votes.rows[0].count),
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}
