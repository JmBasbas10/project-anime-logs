'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'

export interface PlayerSummary {
  player_id: number
  player_name: string
  cash: number
  highest_wave: number
  total_kills: number
  last_seen: string
  event_type: string
  total_events: number
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString()
}

interface Props {
  players: PlayerSummary[]
}

export function PlayersList({ players }: Props) {
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)
  const [sort, setSort]         = useState<'last_seen' | 'cash' | 'wave' | 'kills' | 'events'>('last_seen')
  const router = useRouter()

  const filtered = search.trim()
    ? players.filter(p =>
        p.player_name.toLowerCase().includes(search.toLowerCase()) ||
        String(p.player_id).includes(search)
      )
    : players

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'last_seen') return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
    if (sort === 'cash')   return b.cash - a.cash
    if (sort === 'wave')   return b.highest_wave - a.highest_wave
    if (sort === 'kills')  return b.total_kills - a.total_kills
    if (sort === 'events') return b.total_events - a.total_events
    return 0
  })

  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  function SortTh({ label, col }: { label: string; col: typeof sort }) {
    return (
      <th
        role="button"
        onClick={() => { setSort(col); setPage(1) }}
        className={sort === col ? 'text-primary' : 'text-muted'}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        {label} {sort === col ? '↓' : ''}
      </th>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          All Players <span className="badge bg-secondary ms-1">{players.length}</span>
        </span>
        <div className="input-group input-group-sm" style={{ width: 260 }}>
          <span className="input-group-text bg-transparent">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search name or ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Player</th>
              {SortTh({ label: 'Cash', col: 'cash' })}
              {SortTh({ label: 'Wave', col: 'wave' })}
              {SortTh({ label: 'Kills', col: 'kills' })}
              {SortTh({ label: 'Events', col: 'events' })}
              {SortTh({ label: 'Last Seen', col: 'last_seen' })}
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted py-5">No players found</td></tr>
            )}
            {paginated.map((player, i) => (
              <tr key={player.player_id}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{player.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{player.player_id}</div>
                </td>
                <td className="font-monospace">{player.cash.toLocaleString()}</td>
                <td className="font-monospace">{player.highest_wave}</td>
                <td className="font-monospace">{player.total_kills.toLocaleString()}</td>
                <td>
                  <span className="badge bg-primary-subtle text-primary-emphasis">
                    {player.total_events}
                  </span>
                </td>
                <td className="text-muted" style={{ fontSize: 12 }}>{fmt(player.last_seen)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => router.push(`/players/${encodeURIComponent(player.player_name)}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={sorted.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />
    </>
  )
}
