import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const db = getDb()
    const body = await req.json()
    const page = String(body.page || '/').slice(0, 100)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    await db.execute({
      sql: 'INSERT INTO page_views (page, ip_address) VALUES (?, ?)',
      args: [page, ip],
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
