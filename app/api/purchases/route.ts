import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, validateReadApiKey, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, Number(searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')))
  const from  = (page - 1) * limit

  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('product_purchases')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data, pagination: { page, limit, total: count ?? 0 } })
}

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: { purchases: unknown[] }
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.purchases) || body.purchases.length === 0)
    return Response.json({ error: 'purchases array is required' }, { status: 400 })

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('product_purchases').insert(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (body.purchases as any[]).map(p => ({
      player_name:  p.player_name,
      player_id:    p.player_id,
      product_name: p.product_name,
      robux_spent:  p.robux_spent,
      ...(p.timestamp ? { created_at: p.timestamp } : {}),
    }))
  )

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, count: body.purchases.length }, { status: 201 })
}
