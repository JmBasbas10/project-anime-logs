import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'
import { createSessionToken, SESSION_COOKIE } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: null }))

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return Response.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = await createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return Response.json({ ok: true })
}
