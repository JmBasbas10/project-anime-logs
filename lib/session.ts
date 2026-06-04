export const SESSION_COOKIE = 'al_session'
const PAYLOAD = 'authenticated'

async function hmac(secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(PAYLOAD))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

export async function createSessionToken(): Promise<string> {
  return hmac(process.env.DASHBOARD_SECRET!)
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const expected = await hmac(process.env.DASHBOARD_SECRET!)
    return token === expected
  } catch {
    return false
  }
}
