import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateReadApiKey, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const supabase = createAdminSupabaseClient()
  const activeSince = new Date(Date.now() - 5 * 60_000).toISOString()

  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .gte('last_ping', activeSince)
    .order('last_ping', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ data })
}
