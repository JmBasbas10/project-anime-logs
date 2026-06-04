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
    .limit(200)

  const snapshots = (data as PlayerSnapshotWithData[]) ?? []
  const totalPlayers = new Set(snapshots.map((s) => s.player_id)).size
  const latest = snapshots[0]?.batch_timestamp

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Player Snapshots</h2>
          <p className="text-muted small mb-0">
            Batch inventory snapshots — click any row to expand
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="card text-center px-3 py-2">
            <div className="fw-bold fs-5">{snapshots.length}</div>
            <div className="text-muted small">Snapshots</div>
          </div>
          <div className="card text-center px-3 py-2">
            <div className="fw-bold fs-5">{totalPlayers}</div>
            <div className="text-muted small">Players</div>
          </div>
          {latest && (
            <div className="card text-center px-3 py-2">
              <div className="fw-bold small">{new Date(latest).toLocaleTimeString()}</div>
              <div className="text-muted small">Last batch</div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">{error.message}</div>
      )}

      <LogsTable snapshots={snapshots} />
    </div>
  )
}
