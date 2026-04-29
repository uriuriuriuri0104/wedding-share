import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'
import { removePhoto } from '@/lib/storage'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { action } = await req.json()
  await initDb()
  const db = getDb()

  if (action === 'approve') {
    await db.execute({ sql: "UPDATE photos SET status = 'approved' WHERE id = ?", args: [params.id] })
    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    await db.execute({ sql: "UPDATE photos SET status = 'pending' WHERE id = ?", args: [params.id] })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '不正なアクション' }, { status: 400 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  await initDb()
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT filename FROM photos WHERE id = ?', args: [params.id] })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: '写真が見つかりません' }, { status: 404 })
  }

  const storedName = result.rows[0].filename as string
  await db.execute({ sql: 'DELETE FROM photos WHERE id = ?', args: [params.id] })
  await removePhoto(storedName)

  return NextResponse.json({ success: true })
}
