import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wedding-share-secret-key-change-in-production'
)

const COOKIE_NAME = 'admin_token'

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}

export async function getAdminTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getAdminTokenFromCookie()
  if (!token) return false
  return verifyAdminToken(token)
}

export { COOKIE_NAME }
