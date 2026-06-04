import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateReadApiKey, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')))
  const eventType = searchParams.get('event_type')
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = createAdminSupabaseClient()

  let query = supabase
    .from('player_events')
    .select(
      `*, inventory:player_inventory(*), items:player_items(*), equipped:player_equipped(*)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (eventType === 'join' || eventType === 'leave') {
    query = query.eq('event_type', eventType)
  }

  const { data, error, count } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    data,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  })
}
