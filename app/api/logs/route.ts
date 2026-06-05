import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateReadApiKey, unauthorized } from '@/lib/auth'
import { parsePagination } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { page, limit, from, to } = parsePagination(request)
  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('player_snapshots')
    .select(
      '*, inventory:snapshot_inventory(*), items:snapshot_items(*), equipped:snapshot_equipped(*)',
      { count: 'planned' }
    )
    .order('batch_timestamp', { ascending: false })
    .range(from, to)

  if (error) return Response.json({ error: 'Unable to load snapshots' }, { status: 500 })

  return Response.json({
    data,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  })
}
