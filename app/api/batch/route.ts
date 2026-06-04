import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, unauthorized } from '@/lib/auth'
import type { BatchPayload } from '@/lib/types'

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: BatchPayload
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { timestamp, players } = body
  if (!Array.isArray(players) || players.length === 0) {
    return Response.json({ error: 'players array is required' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  // 1 — insert all snapshot rows and get their IDs back
  const { data: snapshots, error: snapErr } = await supabase
    .from('player_snapshots')
    .insert(
      players.map((p) => ({
        player_id: p.player_id,
        player_name: p.player_name,
        cash: p.cash,
        highest_wave: p.highest_wave,
        total_kills: p.total_kills,
        batch_timestamp: timestamp,
      }))
    )
    .select('id, player_id')

  if (snapErr || !snapshots) {
    return Response.json({ error: snapErr?.message ?? 'Snapshot insert failed' }, { status: 500 })
  }

  // Build a map player_id → snapshot_id (last write wins for duplicates in same batch)
  const idMap = new Map<number, string>(snapshots.map((s) => [s.player_id as number, s.id as string]))

  // 2 — bulk insert child tables in parallel
  const allInventory = players.flatMap((p) =>
    (p.inventory ?? []).map((c) => ({ ...c, snapshot_id: idMap.get(p.player_id) }))
  )
  const allItems = players.flatMap((p) =>
    (p.items ?? []).map((i) => ({ ...i, snapshot_id: idMap.get(p.player_id) }))
  )
  const allEquipped = players.flatMap((p) =>
    (p.equipped ?? []).map((e) => ({ ...e, snapshot_id: idMap.get(p.player_id) }))
  )

  const writes: PromiseLike<unknown>[] = []
  if (allInventory.length) writes.push(supabase.from('snapshot_inventory').insert(allInventory))
  if (allItems.length) writes.push(supabase.from('snapshot_items').insert(allItems))
  if (allEquipped.length) writes.push(supabase.from('snapshot_equipped').insert(allEquipped))

  await Promise.all(writes)

  return Response.json({ ok: true, count: players.length }, { status: 201 })
}
