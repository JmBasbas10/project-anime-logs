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
    .limit(200)

  const events = (data as PlayerEvent[]) ?? []
  const joins = events.filter((e) => e.event_type === 'join').length
  const leaves = events.filter((e) => e.event_type === 'leave').length

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Player Events</h2>
          <p className="text-muted small mb-0">Join and leave events sent by your Roblox game</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="card text-center px-3 py-2">
            <div className="fw-bold text-success fs-5">{joins}</div>
            <div className="text-muted small">Joins</div>
          </div>
          <div className="card text-center px-3 py-2">
            <div className="fw-bold text-secondary fs-5">{leaves}</div>
            <div className="text-muted small">Leaves</div>
          </div>
          <div className="card text-center px-3 py-2">
            <div className="fw-bold fs-5">{events.length}</div>
            <div className="text-muted small">Total</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error.message}</div>}

      <EventsTable events={events} />
    </div>
  )
}
