import { createAdminSupabaseClient } from '@/lib/supabase'
import { LogsTable } from '@/components/logs/logs-table'
import type { PlayerSnapshotWithData } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('player_snapshots')
    .select(`*, inventory:snapshot_inventory(*), items:snapshot_items(*), equipped:snapshot_equipped(*)`)
    .order('batch_timestamp', { ascending: false })
    .limit(500)

  const snapshots = (data as PlayerSnapshotWithData[]) ?? []
  const uniquePlayers = new Set(snapshots.map(s => s.player_id)).size
  const latest = snapshots[0]?.batch_timestamp

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Snapshots</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>Periodic batch inventory snapshots from your game</div>
        </div>
        <div className="d-flex gap-2">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{snapshots.length}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Snapshots</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{uniquePlayers}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Players</div>
          </div>
          {latest && (
            <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
              <div className="fw-bold" style={{ fontSize: 13 }}>{new Date(latest).toLocaleTimeString()}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>Last batch</div>
            </div>
          )}
        </div>
      </div>
      {error && <div className="alert alert-danger small">{error.message}</div>}
      <LogsTable snapshots={snapshots} />
    </div>
  )
}
