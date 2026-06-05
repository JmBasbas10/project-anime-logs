import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, unauthorized } from '@/lib/auth'
import type { BatchPayload } from '@/lib/types'
import {
  chunksOf,
  inputErrorResponse,
  readJsonBody,
  requireBoundedArray,
} from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: BatchPayload
  try {
    body = await readJsonBody<BatchPayload>(request)
    requireBoundedArray(body.players, 'players', 100)
  } catch (error) {
    return inputErrorResponse(error)
  }

  const { timestamp, players } = body
  const supabase = createAdminSupabaseClient()
  const snapshots = players.map((player) => ({
    id: crypto.randomUUID(),
    player_id: player.player_id,
    player_name: player.player_name,
    cash: player.cash,
    highest_wave: player.highest_wave,
    total_kills: player.total_kills,
    batch_timestamp: timestamp,
  }))

  const { error: snapshotError } = await supabase.from('player_snapshots').insert(snapshots)
  if (snapshotError) {
    return Response.json({ error: 'Snapshot insert failed' }, { status: 500 })
  }

  const allInventory = players.flatMap((player, index) =>
    (player.inventory ?? []).map((row) => ({ ...row, snapshot_id: snapshots[index].id }))
  )
  const allItems = players.flatMap((player, index) =>
    (player.items ?? []).map((row) => ({ ...row, snapshot_id: snapshots[index].id }))
  )
  const allEquipped = players.flatMap((player, index) =>
    (player.equipped ?? []).map((row) => ({ ...row, snapshot_id: snapshots[index].id }))
  )

  const childResults = await Promise.all([
    ...chunksOf(allInventory).map((rows) => supabase.from('snapshot_inventory').insert(rows)),
    ...chunksOf(allItems).map((rows) => supabase.from('snapshot_items').insert(rows)),
    ...chunksOf(allEquipped).map((rows) => supabase.from('snapshot_equipped').insert(rows)),
  ])

  if (childResults.some((result) => result.error)) {
    return Response.json({ error: 'One or more snapshot detail inserts failed' }, { status: 500 })
  }

  return Response.json({ ok: true, count: players.length }, { status: 201 })
}
