import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initDb()
    const db = getDb()
    const { action } = await req.json()

    if (action === 'like') {
      await db.execute({
        sql: 'UPDATE photos SET likes_count = likes_count + 1 WHERE id = ? AND status = ?',
        args: [params.id, 'approved'],
      })
    } else if (action === 'unlike') {
      await db.execute({
        sql: 'UPDATE photos SET likes_count = CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END WHERE id = ? AND status = ?',
        args: [params.id, 'approved'],
      })
    } else {
      return NextResponse.json({ error: '無効なアクション' }, { status: 400 })
    }

    const result = await db.execute({
      sql: 'SELECT likes_count FROM photos WHERE id = ?',
      args: [params.id],
    })
    const likes = Number(result.rows[0]?.likes_count ?? 0)
    return NextResponse.json({ likes })
  } catch (err) {
    console.error('Like error:', err)
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 })
  }
}
