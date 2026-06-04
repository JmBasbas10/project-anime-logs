import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, validateReadApiKey, unauthorized } from '@/lib/auth'
import type { BulkGiftPayload } from '@/lib/types'

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('gift_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    data,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  })
}

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: BulkGiftPayload
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.gifts) || body.gifts.length === 0) {
    return Response.json({ error: 'gifts array is required' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('gift_logs').insert(
    body.gifts.map((g) => ({
      giver_name:     g.giver_name,
      giver_id:       g.giver_id,
      receiver_name:  g.receiver_name,
      receiver_id:    g.receiver_id,
      character_name: g.character_name,
      character_id:   g.character_id,
      level:          g.level,
      mutation:       g.mutation,
      trait:          g.trait,
      ...(g.timestamp ? { created_at: g.timestamp } : {}),
    }))
  )

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, count: body.gifts.length }, { status: 201 })
}
