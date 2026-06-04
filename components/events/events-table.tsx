'use client'

import { useState } from 'react'
import type { PlayerEventWithSnapshot } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'
import { CharacterAvatar } from '@/components/character-avatar'

function fmt(iso: string) { return new Date(iso).toLocaleString() }
function dur(s: number | null) {
  if (!s) return '—'
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

async function toggleArchive(id: string, archived: boolean) {
  await fetch('/api/archive', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'player_events', id, archived }),
  })
}

function SnapshotSection({ title, rows }: {
  title: string
  rows: { name: string; character_id?: string; detail: string }[]
}) {
  return (
    <div className="col-12 col-md-4">
      <p className="fw-semibold text-uppercase text-muted mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>
        {title} ({rows.length})
      </p>
      {rows.length === 0 ? (
        <span className="text-muted small">None</span>
      ) : (
        <ul className="list-unstyled mb-0">
          {rows.map((r, i) => (
            <li key={i} className="mb-2 d-flex gap-2">
              {r.character_id && <CharacterAvatar name={r.name} size={32} />}
              <div style={{ minWidth: 0 }}>
                <div className="fw-medium small text-truncate">{r.name}</div>
                {r.character_id && (
                  <div className="text-muted font-monospace text-truncate" style={{ fontSize: 10 }}>{r.character_id}</div>
                )}
                <div className="text-muted" style={{ fontSize: 11 }}>{r.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EventModal({ event, isArchived, onArchiveToggle }: {
  event: PlayerEventWithSnapshot
  isArchived: boolean
  onArchiveToggle: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await toggleArchive(event.id, !isArchived)
    onArchiveToggle()
    setLoading(false)
  }

  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">{event.player_name}</h5>
          <span className="text-muted small">
            #{event.player_id} ·{' '}
            <span className={`badge rounded-pill ms-1 ${event.event_type === 'join' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
              {event.event_type}
            </span>
            {isArchived && <span className="badge bg-warning-subtle text-warning-emphasis ms-1">Archived</span>}
          </span>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        <div className="row g-2 mb-4">
          {[
            { l: 'Cash',     v: event.cash.toLocaleString() },
            { l: 'Wave',     v: event.highest_wave },
            { l: 'Kills',    v: event.total_kills.toLocaleString() },
            { l: 'Duration', v: dur(event.session_duration_seconds) },
          ].map(({ l, v }) => (
            <div key={l} className="col-3">
              <div className="card text-center py-2">
                <div className="fw-bold font-monospace">{v}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{l}</div>
              </div>
            </div>
          ))}
        </div>
        <table className="table table-sm table-bordered small mb-4">
          <tbody>
            <tr><td className="text-muted fw-medium" style={{ width: 110 }}>Joined</td><td>{event.joined_at ? fmt(event.joined_at) : '—'}</td></tr>
            <tr><td className="text-muted fw-medium">Left</td><td>{event.left_at ? fmt(event.left_at) : '—'}</td></tr>
            <tr><td className="text-muted fw-medium">Logged</td><td>{fmt(event.created_at)}</td></tr>
          </tbody>
        </table>
        <div className="row g-3">
          <SnapshotSection title="Inventory" rows={event.inventory.map(c => ({ name: c.character_name, character_id: c.character_id, detail: `Lv${c.level} · ${c.mutation} · ${c.trait}` }))} />
          <SnapshotSection title="Items"     rows={event.items.map(i => ({ name: i.item_name, detail: `×${i.quantity}` }))} />
          <SnapshotSection title="Equipped"  rows={event.equipped.map(c => ({ name: c.character_name, character_id: c.character_id, detail: `Lv${c.level} · ${c.mutation} · ${c.trait}` }))} />
        </div>
      </div>
      <div className="modal-footer justify-content-between">
        <button
          className={`btn btn-sm ${isArchived ? 'btn-outline-success' : 'btn-outline-warning'}`}
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? '…' : isArchived ? '↩ Unarchive' : '🗄 Archive'}
        </button>
        <button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
      </div>
    </>
  )
}

interface Props { events: PlayerEventWithSnapshot[] }

export function EventsTable({ events }: Props) {
  const [selected, setSelected]     = useState<PlayerEventWithSnapshot | null>(null)
  const [tab, setTab]               = useState<'all' | 'join' | 'leave'>('all')
  const [search, setSearch]         = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [archivedIds, setArchivedIds]   = useState<Set<string>>(
    () => new Set(events.filter(e => (e as PlayerEventWithSnapshot & { archived?: boolean }).archived).map(e => e.id))
  )
  const [page, setPage]             = useState(1)
  const [perPage, setPerPage]       = useState(10)

  function toggleLocalArchive(id: string) {
    setArchivedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const afterArchive = showArchived ? events.filter(e => archivedIds.has(e.id)) : events.filter(e => !archivedIds.has(e.id))
  const afterTab     = afterArchive.filter(e => tab === 'all' ? true : e.event_type === tab)
  const afterSearch  = search.trim() ? afterTab.filter(e =>
    e.player_name.toLowerCase().includes(search.toLowerCase()) || String(e.player_id).includes(search)
  ) : afterTab
  const paginated    = afterSearch.slice((page - 1) * perPage, page * perPage)

  const joins  = events.filter(e => e.event_type === 'join' && !archivedIds.has(e.id)).length
  const leaves = events.filter(e => e.event_type === 'leave' && !archivedIds.has(e.id)).length
  const archivedCount = archivedIds.size

  const tabs = [
    { key: 'all'   as const, label: 'All',    count: events.filter(e => !archivedIds.has(e.id)).length },
    { key: 'join'  as const, label: 'Joins',  count: joins },
    { key: 'leave' as const, label: 'Leaves', count: leaves },
  ]

  return (
    <>
      <div className="d-flex align-items-end justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 0 }}>
        <ul className="nav nav-tabs border-0">
          {tabs.map(({ key, label, count }) => (
            <li key={key} className="nav-item">
              <button className={`nav-link px-3 py-2 ${tab === key ? 'active' : ''}`}
                onClick={() => { setTab(key); setPage(1) }} style={{ fontSize: 14 }}>
                {label} <span className="badge bg-secondary ms-1" style={{ fontSize: 11 }}>{count}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="d-flex gap-2 mb-1 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 220 }}>
            <span className="input-group-text bg-transparent">🔍</span>
            <input type="text" className="form-control" placeholder="Search…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <button
            className={`btn btn-sm ${showArchived ? 'btn-warning' : 'btn-outline-secondary'}`}
            onClick={() => { setShowArchived(v => !v); setPage(1) }}
          >
            🗄 {showArchived ? `Archived (${archivedCount})` : `Archive (${archivedCount})`}
          </button>
        </div>
      </div>

      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Player</th><th>Type</th>
              <th className="text-end">Cash</th><th className="text-end">Wave</th><th className="text-end">Kills</th>
              <th className="d-none d-md-table-cell">Duration</th>
              <th className="d-none d-lg-table-cell">Time</th>
              <th style={{ width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && <tr><td colSpan={9} className="text-center text-muted py-5">No events found</td></tr>}
            {paginated.map((event, i) => {
              const isArchived = archivedIds.has(event.id)
              return (
                <tr key={event.id} style={{ opacity: isArchived ? 0.5 : 1 }}>
                  <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                  <td>
                    <div className="fw-medium">{event.player_name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>#{event.player_id}</div>
                  </td>
                  <td>
                    <span className={`badge rounded-pill ${event.event_type === 'join' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                      {event.event_type}
                    </span>
                    {isArchived && <span className="badge bg-warning-subtle text-warning-emphasis ms-1" style={{ fontSize: 10 }}>archived</span>}
                  </td>
                  <td className="text-end font-monospace">{event.cash.toLocaleString()}</td>
                  <td className="text-end font-monospace">{event.highest_wave}</td>
                  <td className="text-end font-monospace">{event.total_kills.toLocaleString()}</td>
                  <td className="text-muted small d-none d-md-table-cell">{dur(event.session_duration_seconds)}</td>
                  <td className="text-muted d-none d-lg-table-cell" style={{ fontSize: 12 }}>{fmt(event.created_at)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary"
                      data-bs-toggle="modal" data-bs-target="#event-modal"
                      onClick={() => setSelected(event)}>···</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={afterSearch.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />

      <div className="modal fade" id="event-modal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            {selected && (
              <EventModal
                event={selected}
                isArchived={archivedIds.has(selected.id)}
                onArchiveToggle={() => toggleLocalArchive(selected.id)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
