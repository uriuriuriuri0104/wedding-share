import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signAdminToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'ユーザー名とパスワードを入力してください' }, { status: 400 })
  }

  await initDb()
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM admins WHERE username = ?', args: [username] })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが違います' }, { status: 401 })
  }

  const admin = result.rows[0]
  const passwordHash = admin.password_hash as string

  if (!bcrypt.compareSync(password, passwordHash)) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが違います' }, { status: 401 })
  }

  const token = await signAdminToken()

  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return res
}
