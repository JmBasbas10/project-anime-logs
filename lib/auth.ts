import { type NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session'

export async function validateDashboardSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySessionToken(token)
}

export function validateRobloxApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  const validKeys = [
    process.env.ROBLOX_API_SECRET,
    process.env.ROBLOX_API_SECRET_PREVIOUS,
  ].filter(Boolean)
  return !!key && validKeys.includes(key)
}

export function validateReadApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return (
    !!key &&
    (
      key === process.env.ROBLOX_API_SECRET ||
      key === process.env.ROBLOX_API_SECRET_PREVIOUS ||
      key === process.env.DISCORD_BOT_API_KEY
    )
  )
}

export function unauthorized(message = 'Unauthorized', requestId?: string) {
  return Response.json(
    { error: message, ...(requestId ? { request_id: requestId } : {}) },
    { status: 401, headers: requestId ? { 'x-request-id': requestId } : undefined }
  )
}
