import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { PlayerTimeline } from '@/components/players/player-timeline'
import type { PlayerSnapshotWithData } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export default async function PlayerPage({ params }: Props) {
  const { username } = await params
  const decoded = decodeURIComponent(username)
  const isId = /^\d+$/.test(decoded)

  const supabase = createAdminSupabaseClient()

  const query = supabase
    .from('player_snapshots')
    .select(`*, inventory:snapshot_inventory(*), items:snapshot_items(*), equipped:snapshot_equipped(*)`)
    .order('batch_timestamp', { ascending: false })

  const { data, error } = await (isId
    ? query.eq('player_id', Number(decoded))
    : query.eq('player_name', decoded))

  if (error) notFound()

  const snapshots = (data as PlayerSnapshotWithData[]) ?? []
  const displayName = isId ? (snapshots[0]?.player_name ?? `Player #${decoded}`) : decoded
  const latest = snapshots[0]

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <Link href="/players" className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 mb-2">
          ← Back to search
        </Link>

        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-0">{displayName}</h2>
            {snapshots[0] && (
              <div className="text-muted small">Player ID: #{snapshots[0].player_id}</div>
            )}
            <div className="text-muted small">{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} recorded</div>
          </div>

          {latest && (
            <div className="d-flex gap-2 flex-wrap">
              <div className="card text-center px-3 py-2">
                <div className="fw-bold font-monospace">{latest.cash.toLocaleString()}</div>
                <div className="text-muted small">Cash</div>
              </div>
              <div className="card text-center px-3 py-2">
                <div className="fw-bold font-monospace">{latest.highest_wave}</div>
                <div className="text-muted small">Highest Wave</div>
              </div>
              <div className="card text-center px-3 py-2">
                <div className="fw-bold font-monospace">{latest.total_kills.toLocaleString()}</div>
                <div className="text-muted small">Total Kills</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PlayerTimeline username={displayName} snapshots={snapshots} />
    </div>
  )
}
