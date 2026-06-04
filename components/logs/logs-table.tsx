'use client'

import { Fragment, useState } from 'react'
import type { PlayerSnapshotWithData } from '@/lib/types'

type Filter = 'all' | string   // 'all' or a player name search string

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

function SnapshotDetail({ snapshot }: { snapshot: PlayerSnapshotWithData }) {
  return (
    <div className="row g-3 p-2">
      <div className="col-12 col-md-4">
        <p className="text-uppercase text-muted small fw-semibold mb-2">Inventory</p>
        {snapshot.inventory.length === 0 ? (
          <span className="text-muted small">None</span>
        ) : (
          <ul className="list-unstyled mb-0">
            {snapshot.inventory.map((c, i) => (
              <li key={i} className="small mb-1">
                <span className="fw-medium">{c.character_name}</span>
                <span className="text-muted ms-2">
                  Lv{c.level} · {c.mutation} · {c.trait}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="col-12 col-md-4">
        <p className="text-uppercase text-muted small fw-semibold mb-2">Items</p>
        {snapshot.items.length === 0 ? (
          <span className="text-muted small">None</span>
        ) : (
          <ul className="list-unstyled mb-0">
            {snapshot.items.map((item, i) => (
              <li key={i} className="small mb-1">
                <span className="fw-medium">{item.item_name}</span>
                <span className="text-muted ms-2">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="col-12 col-md-4">
        <p className="text-uppercase text-muted small fw-semibold mb-2">Equipped</p>
        {snapshot.equipped.length === 0 ? (
          <span className="text-muted small">None</span>
        ) : (
          <ul className="list-unstyled mb-0">
            {snapshot.equipped.map((c, i) => (
              <li key={i} className="small mb-1">
                <span className="fw-medium">{c.character_name}</span>
                <span className="text-muted ms-2">
                  Lv{c.level} · {c.mutation} · {c.trait}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

interface Props {
  snapshots: PlayerSnapshotWithData[]
}

export function LogsTable({ snapshots }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = search.trim()
    ? snapshots.filter(
        (s) =>
          s.player_name.toLowerCase().includes(search.toLowerCase()) ||
          String(s.player_id).includes(search)
      )
    : snapshots

  return (
    <div>
      {/* Search bar */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Filter by username or player ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover table-bordered align-middle mb-0">
          <thead className="table-secondary">
            <tr>
              <th style={{ width: 32 }} />
              <th>Player</th>
              <th className="text-end">Cash</th>
              <th className="text-end">Wave</th>
              <th className="text-end">Kills</th>
              <th>Batch Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No snapshots found
                </td>
              </tr>
            )}
            {filtered.map((snap) => {
              const isOpen = expanded.has(snap.id)
              return (
                <Fragment key={snap.id}>
                  <tr
                    role="button"
                    onClick={() => toggle(snap.id)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <td className="text-center text-muted small">{isOpen ? '▼' : '▶'}</td>
                    <td>
                      <div className="fw-medium">{snap.player_name}</div>
                      <div className="text-muted small">#{snap.player_id}</div>
                    </td>
                    <td className="text-end font-monospace">{snap.cash.toLocaleString()}</td>
                    <td className="text-end font-monospace">{snap.highest_wave}</td>
                    <td className="text-end font-monospace">{snap.total_kills.toLocaleString()}</td>
                    <td className="text-muted small">{formatDate(snap.batch_timestamp)}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <SnapshotDetail snapshot={snap} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
