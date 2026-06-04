'use client'

import { useState } from 'react'
import type { PlayerEvent } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function EventModalBody({ event, onClose }: { event: PlayerEvent; onClose: () => void }) {
  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">{event.player_name}</h5>
          <div className="text-muted small">#{event.player_id}</div>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={onClose} />
      </div>
      <div className="modal-body">
        <div className="row g-2 mb-3">
          {[
            { label: 'Event', value: event.event_type.toUpperCase() },
            { label: 'Cash', value: event.cash.toLocaleString() },
            { label: 'Highest Wave', value: event.highest_wave },
            { label: 'Total Kills', value: event.total_kills.toLocaleString() },
            { label: 'Duration', value: formatDuration(event.session_duration_seconds) },
          ].map(({ label, value }) => (
            <div key={label} className="col-6 col-md-4 col-lg">
              <div className="card text-center py-2 px-1">
                <div className="fw-bold font-monospace">{value}</div>
                <div className="text-muted small">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <table className="table table-sm table-bordered small mb-0">
          <tbody>
            <tr>
              <td className="text-muted fw-medium" style={{ width: 140 }}>Joined at</td>
              <td>{event.joined_at ? formatDate(event.joined_at) : '—'}</td>
            </tr>
            <tr>
              <td className="text-muted fw-medium">Left at</td>
              <td>{event.left_at ? formatDate(event.left_at) : '—'}</td>
            </tr>
            <tr>
              <td className="text-muted fw-medium">Logged at</td>
              <td>{formatDate(event.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </>
  )
}

interface Props {
  events: PlayerEvent[]
}

export function EventsTable({ events }: Props) {
  const [selected, setSelected] = useState<PlayerEvent | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'join' | 'leave'>('all')

  const filtered = events.filter((e) => {
    const matchType = typeFilter === 'all' || e.event_type === typeFilter
    const matchSearch =
      !search.trim() ||
      e.player_name.toLowerCase().includes(search.toLowerCase()) ||
      String(e.player_id).includes(search)
    return matchType && matchSearch
  })

  return (
    <>
      {/* Filters */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Filter by username or player ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div className="btn-group btn-group-sm">
          {(['all', 'join', 'leave'] as const).map((t) => (
            <button
              key={t}
              className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive rounded border">
        <table className="table table-hover table-bordered mb-0" style={{ fontSize: 14 }}>
          <thead className="table-dark">
            <tr>
              <th>Player</th>
              <th>Type</th>
              <th className="text-end">Cash</th>
              <th className="text-end">Wave</th>
              <th className="text-end">Kills</th>
              <th>Duration</th>
              <th>Time</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">No events found</td>
              </tr>
            )}
            {filtered.map((event) => (
              <tr key={event.id}>
                <td>
                  <div className="fw-medium">{event.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{event.player_id}</div>
                </td>
                <td>
                  <span className={`badge ${event.event_type === 'join' ? 'bg-success' : 'bg-secondary'}`}>
                    {event.event_type}
                  </span>
                </td>
                <td className="text-end font-monospace">{event.cash.toLocaleString()}</td>
                <td className="text-end font-monospace">{event.highest_wave}</td>
                <td className="text-end font-monospace">{event.total_kills.toLocaleString()}</td>
                <td className="text-muted small">{formatDuration(event.session_duration_seconds)}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{formatDate(event.created_at)}</td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#event-modal"
                    onClick={() => setSelected(event)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shared modal */}
      <div className="modal fade" id="event-modal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            {selected && <EventModalBody event={selected} onClose={() => setSelected(null)} />}
          </div>
        </div>
      </div>
    </>
  )
}
