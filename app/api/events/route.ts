import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, unauthorized } from '@/lib/auth'
import type { EventPayload } from '@/lib/types'
import { chunksOf, inputErrorResponse, readJsonBody } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: EventPayload
  try {
    body = await readJsonBody<EventPayload>(request)
  } catch (error) {
    return inputErrorResponse(error)
  }

  const supabase = createAdminSupabaseClient()
  const eventId = crypto.randomUUID()
  const { error } = await supabase.from('player_events').insert({
    id: eventId,
    player_name: body.player_name,
    player_id: body.player_id,
    event_type: body.event_type,
    cash: body.cash,
    highest_wave: body.highest_wave,
    total_kills: body.total_kills,
    joined_at: body.joined_at,
    left_at: body.left_at ?? null,
    session_duration_seconds: body.session_duration_seconds ?? null,
  })

  if (error) {
    return Response.json({ error: 'Event insert failed' }, { status: 500 })
  }

  const childResults = await Promise.all([
    ...chunksOf(body.inventory ?? []).map((rows) =>
      supabase.from('player_inventory').insert(rows.map((row) => ({ ...row, event_id: eventId })))
    ),
    ...chunksOf(body.items ?? []).map((rows) =>
      supabase.from('player_items').insert(rows.map((row) => ({ ...row, event_id: eventId })))
    ),
    ...chunksOf(body.equipped ?? []).map((rows) =>
      supabase.from('player_equipped').insert(rows.map((row) => ({ ...row, event_id: eventId })))
    ),
  ])

  if (childResults.some((result) => result.error)) {
    return Response.json({ error: 'One or more event detail inserts failed' }, { status: 500 })
  }

  return Response.json({ id: eventId }, { status: 201 })
}
