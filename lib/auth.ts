import { type NextRequest } from 'next/server'

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
