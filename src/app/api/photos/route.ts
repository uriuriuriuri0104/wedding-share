import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute(`
      SELECT id, filename, original_name, uploader_name, message, created_at
      FROM photos
      WHERE status = 'approved'
      ORDER BY created_at DESC
    `)

    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Get photos error:', err)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}
