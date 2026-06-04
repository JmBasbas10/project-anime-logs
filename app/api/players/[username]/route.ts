import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateReadApiKey, unauthorized } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { username } = await params
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('player_events')
    .select(
      `*, inventory:player_inventory(*), items:player_items(*), equipped:player_equipped(*)`
    )
    .eq('player_name', username)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ username, sessions: data })
}
