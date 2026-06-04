'use client'

import { useState } from 'react'
import type { PlayerEventWithSnapshot } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'

function fmt(iso: string) { return new Date(iso).toLocaleString() }
function dur(s: number | null) {
  if (!s) return '—'
  return `${Math.floor(s / 60)}m ${s % 60}s`
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
            <li key={i} className="mb-2">
              <div className="fw-medium small">{r.name}</div>
              {r.character_id && (
                <div className="text-muted font-monospace" style={{ fontSize: 10 }}>{r.character_id}</div>
              )}
              <div className="text-muted" style={{ fontSize: 11 }}>{r.detail}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EventModal({ event }: { event: PlayerEventWithSnapshot }) {
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
          </span>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        {/* Stats */}
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

        {/* Timestamps */}
        <table className="table table-sm table-bordered small mb-4">
          <tbody>
            <tr><td className="text-muted fw-medium" style={{ width: 110 }}>Joined</td><td>{event.joined_at ? fmt(event.joined_at) : '—'}</td></tr>
            <tr><td className="text-muted fw-medium">Left</td><td>{event.left_at ? fmt(event.left_at) : '—'}</td></tr>
            <tr><td className="text-muted fw-medium">Logged</td><td>{fmt(event.created_at)}</td></tr>
          </tbody>
        </table>

        {/* Snapshot data */}
        <div className="row g-3">
          <SnapshotSection
            title="Inventory"
            rows={event.inventory.map(c => ({ name: c.character_name, character_id: c.character_id, detail: `Lv${c.level} · ${c.mutation} · ${c.trait}` }))}
          />
          <SnapshotSection
            title="Items"
            rows={event.items.map(i => ({ name: i.item_name, detail: `×${i.quantity}` }))}
          />
          <SnapshotSection
            title="Equipped"
            rows={event.equipped.map(c => ({ name: c.character_name, character_id: c.character_id, detail: `Lv${c.level} · ${c.mutation} · ${c.trait}` }))}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
      </div>
    </>
  )
}

interface Props { events: PlayerEventWithSnapshot[] }

export function EventsTable({ events }: Props) {
  const [selected, setSelected]   = useState<PlayerEventWithSnapshot | null>(null)
  const [tab, setTab]             = useState<'all' | 'join' | 'leave'>('all')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [perPage, setPerPage]     = useState(10)

  const afterTab = events.filter(e => tab === 'all' ? true : e.event_type === tab)
  const afterSearch = search.trim()
    ? afterTab.filter(e =>
        e.player_name.toLowerCase().includes(search.toLowerCase()) ||
        String(e.player_id).includes(search)
      )
    : afterTab

  const paginated = afterSearch.slice((page - 1) * perPage, page * perPage)
  const joins  = events.filter(e => e.event_type === 'join').length
  const leaves = events.filter(e => e.event_type === 'leave').length

  const tabs = [
    { key: 'all'   as const, label: 'All',    count: events.length },
    { key: 'join'  as const, label: 'Joins',  count: joins },
    { key: 'leave' as const, label: 'Leaves', count: leaves },
  ]

  return (
    <>
      {/* Tab bar + search */}
      <div className="d-flex align-items-end justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 0 }}>
        <ul className="nav nav-tabs border-0">
          {tabs.map(({ key, label, count }) => (
            <li key={key} className="nav-item">
              <button
                className={`nav-link px-3 py-2 ${tab === key ? 'active' : ''}`}
                onClick={() => { setTab(key); setPage(1) }}
                style={{ fontSize: 14 }}
              >
                {label} <span className="badge bg-secondary ms-1" style={{ fontSize: 11 }}>{count}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="input-group input-group-sm mb-1" style={{ width: 260 }}>
          <span className="input-group-text bg-transparent">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search player or ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Player</th>
              <th>Type</th>
              <th className="text-end">Cash</th>
              <th className="text-end">Wave</th>
              <th className="text-end">Kills</th>
              <th>Duration</th>
              <th>Inv</th>
              <th>Time</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={10} className="text-center text-muted py-5">No events found</td></tr>
            )}
            {paginated.map((event, i) => (
              <tr key={event.id}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{event.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{event.player_id}</div>
                </td>
                <td>
                  <span className={`badge rounded-pill ${event.event_type === 'join' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                    {event.event_type}
                  </span>
                </td>
                <td className="text-end font-monospace">{event.cash.toLocaleString()}</td>
                <td className="text-end font-monospace">{event.highest_wave}</td>
                <td className="text-end font-monospace">{event.total_kills.toLocaleString()}</td>
                <td className="text-muted small">{dur(event.session_duration_seconds)}</td>
                <td className="text-muted small">
                  {event.inventory.length > 0 && (
                    <span className="badge bg-primary-subtle text-primary-emphasis me-1">{event.inventory.length}</span>
                  )}
                </td>
                <td className="text-muted" style={{ fontSize: 12 }}>{fmt(event.created_at)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal"
                    data-bs-target="#event-modal"
                    onClick={() => setSelected(event)}
                  >
                    ···
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={afterSearch.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />

      <div className="modal fade" id="event-modal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            {selected && <EventModal event={selected} />}
          </div>
        </div>
      </div>
    </>
  )
}
