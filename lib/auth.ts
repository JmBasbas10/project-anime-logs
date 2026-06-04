import { type NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session'

export async function validateDashboardSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySessionToken(token)
}

export function validateRobloxApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return !!key && key === process.env.ROBLOX_API_SECRET
}

export function validateReadApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return (
    !!key &&
    (key === process.env.ROBLOX_API_SECRET || key === process.env.DISCORD_BOT_API_KEY)
  )
}

export function unauthorized(message = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 })
}
