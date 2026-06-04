import { createAdminSupabaseClient } from '@/lib/supabase'
import { EventsTable } from '@/components/events/events-table'
import type { PlayerEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('player_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const events = (data as PlayerEvent[]) ?? []
  const joins  = events.filter(e => e.event_type === 'join').length
  const leaves = events.filter(e => e.event_type === 'leave').length

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Player Events</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>Join and leave events from your Roblox game</div>
        </div>
        <div className="d-flex gap-2">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold text-success">{joins}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Joins</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold text-secondary">{leaves}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Leaves</div>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger small">{error.message}</div>}
      <EventsTable events={events} />
    </div>
  )
}
