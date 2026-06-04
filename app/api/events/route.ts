import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, unauthorized } from '@/lib/auth'
import type { EventPayload } from '@/lib/types'

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: EventPayload
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  const { data: event, error } = await supabase
    .from('player_events')
    .insert({
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
    .select('id')
    .single()

  if (error || !event) {
    return Response.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  return Response.json({ id: event.id }, { status: 201 })
}
