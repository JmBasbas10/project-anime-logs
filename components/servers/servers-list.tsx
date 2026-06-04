import type { Server } from '@/lib/types'

function timeSince(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function pingBadge(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 120) return 'bg-success'
  if (diff < 600) return 'bg-warning text-dark'
  return 'bg-danger'
}

interface Props {
  servers: Server[]
}

export function ServersList({ servers }: Props) {
  if (servers.length === 0) {
    return (
      <div className="alert alert-secondary text-center">No active servers</div>
    )
  }

  return (
    <div className="row g-3">
      {servers.map((server) => (
        <div key={server.id} className="col-12 col-sm-6 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="card-title font-monospace mb-0 text-truncate" style={{ maxWidth: '70%' }}>
                  🖥️ {server.server_id.slice(0, 16)}…
                </h6>
                <span className={`badge ${pingBadge(server.last_ping)}`}>
                  {timeSince(server.last_ping)}
                </span>
              </div>
              <div className="display-6 fw-bold">{server.player_count}</div>
              <div className="text-muted small">players online</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
