import { createAdminSupabaseClient } from '@/lib/supabase'
import { PlayersList, type PlayerSummary } from '@/components/players/players-list'
import { PlayerSearch } from '@/components/players/player-search'

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
  const supabase = createAdminSupabaseClient()

  // Fetch recent events — deduplicate by player_id server-side
  const { data } = await supabase
    .from('player_events')
    .select('player_id, player_name, cash, highest_wave, total_kills, created_at, event_type')
    .order('created_at', { ascending: false })
    .limit(5000)

  // Keep most-recent event per player and count total events
  const countMap = new Map<number, number>()
  const seen = new Set<number>()
  const players: PlayerSummary[] = []

  for (const e of data ?? []) {
    const id = e.player_id as number
    countMap.set(id, (countMap.get(id) ?? 0) + 1)
    if (!seen.has(id)) {
      seen.add(id)
      players.push({
        player_id:    id,
        player_name:  e.player_name as string,
        cash:         e.cash as number,
        highest_wave: e.highest_wave as number,
        total_kills:  e.total_kills as number,
        last_seen:    e.created_at as string,
        event_type:   e.event_type as string,
        total_events: 0, // filled below
      })
    }
  }

  // Attach total event counts
  players.forEach(p => { p.total_events = countMap.get(p.player_id) ?? 1 })

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Players</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {players.length} unique player{players.length !== 1 ? 's' : ''} recorded
          </div>
        </div>
        <PlayerSearch />
      </div>

      <PlayersList players={players} />
    </div>
  )
}
