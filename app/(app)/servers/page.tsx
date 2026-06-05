import { createAdminSupabaseClient } from '@/lib/supabase'
import { ServersList } from '@/components/servers/servers-list'
import type { Server } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ServersPage() {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .order('last_ping', { ascending: false })

  const servers = (data as Server[]) ?? []
  const totalPlayers = servers.reduce((sum, s) => sum + s.player_count, 0)

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Active Servers</h2>
          <p className="text-muted small mb-0">Sorted by most recent ping</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="card text-center px-3 py-2">
            <div className="fw-bold fs-5">{servers.length}</div>
            <div className="text-muted small">Servers</div>
          </div>
          <div className="card text-center px-3 py-2">
            <div className="fw-bold fs-5">{totalPlayers}</div>
            <div className="text-muted small">Players online</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error.message}</div>}

      <ServersList servers={servers} />
    </div>
  )
}
