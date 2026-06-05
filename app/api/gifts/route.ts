import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, validateReadApiKey, unauthorized } from '@/lib/auth'
import type { BulkGiftPayload } from '@/lib/types'
import {
  inputErrorResponse,
  parsePagination,
  readJsonBody,
  requireBoundedArray,
} from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { page, limit, from, to } = parsePagination(request)
  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('gift_logs')
    .select('*', { count: 'planned' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return Response.json({ error: 'Unable to load gifts' }, { status: 500 })
  return Response.json({
    data,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  })
}

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: BulkGiftPayload
  try {
    body = await readJsonBody<BulkGiftPayload>(request)
    requireBoundedArray(body.gifts, 'gifts')
  } catch (error) {
    return inputErrorResponse(error)
  }

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('gift_logs').insert(
    body.gifts.map((gift) => ({
      giver_name: gift.giver_name,
      giver_id: gift.giver_id,
      receiver_name: gift.receiver_name,
      receiver_id: gift.receiver_id,
      character_name: gift.character_name,
      character_id: gift.character_id,
      level: gift.level,
      mutation: gift.mutation,
      trait: gift.trait,
      ...(gift.timestamp ? { created_at: gift.timestamp } : {}),
    }))
  )

  if (error) return Response.json({ error: 'Gift insert failed' }, { status: 500 })
  return Response.json({ ok: true, count: body.gifts.length }, { status: 201 })
}
