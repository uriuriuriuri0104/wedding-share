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
    const result = await db.execute(`
      SELECT id, filename, original_name, uploader_name, message, status, file_size, created_at
      FROM photos
      ORDER BY created_at DESC
    `)

    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Admin get photos error:', err)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}
