import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, validateReadApiKey, unauthorized } from '@/lib/auth'
import {
  inputErrorResponse,
  parsePagination,
  readJsonBody,
  requireBoundedArray,
} from '@/lib/api-utils'

interface PurchasePayload {
  player_name: string
  player_id: number
  product_name: string
  robux_spent: number
  timestamp?: string
}

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { page, limit, from, to } = parsePagination(request)
  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('product_purchases')
    .select('*', { count: 'planned' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return Response.json({ error: 'Unable to load purchases' }, { status: 500 })
  return Response.json({ data, pagination: { page, limit, total: count ?? 0 } })
}

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: { purchases: PurchasePayload[] }
  try {
    body = await readJsonBody<{ purchases: PurchasePayload[] }>(request)
    requireBoundedArray(body.purchases, 'purchases')
  } catch (error) {
    return inputErrorResponse(error)
  }

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('product_purchases').insert(
    body.purchases.map((purchase) => ({
      player_name: purchase.player_name,
      player_id: purchase.player_id,
      product_name: purchase.product_name,
      robux_spent: purchase.robux_spent,
      ...(purchase.timestamp ? { created_at: purchase.timestamp } : {}),
    }))
  )

  if (error) return Response.json({ error: 'Purchase insert failed' }, { status: 500 })
  return Response.json({ ok: true, count: body.purchases.length }, { status: 201 })
}
