import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateReadApiKey, unauthorized } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { username } = await params
  const decoded = decodeURIComponent(username)
  const isId = /^\d+$/.test(decoded)

  const supabase = createAdminSupabaseClient()

  const query = supabase
    .from('player_events')
    .select(`*, inventory:player_inventory(*), items:player_items(*), equipped:player_equipped(*)`)
    .order('created_at', { ascending: false })

  const { data, error } = await (isId
    ? query.eq('player_id', Number(decoded))
    : query.eq('player_name', decoded))

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ identifier: decoded, sessions: data })
}
