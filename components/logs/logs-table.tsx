'use client'

import { useState } from 'react'
import type { PlayerSnapshotWithData } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

function SnapshotModalBody({ snap }: { snap: PlayerSnapshotWithData }) {
  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">{snap.player_name}</h5>
          <div className="text-muted small">#{snap.player_id} · {formatDate(snap.batch_timestamp)}</div>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        {/* Stats row */}
        <div className="row g-2 mb-4">
          {[
            { label: 'Cash', value: snap.cash.toLocaleString() },
            { label: 'Highest Wave', value: snap.highest_wave },
            { label: 'Total Kills', value: snap.total_kills.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="col-4">
              <div className="card text-center py-2 px-1">
                <div className="fw-bold font-monospace fs-5">{value}</div>
                <div className="text-muted small">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3">
          {/* Inventory */}
          <div className="col-12 col-md-4">
            <p className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>
              Inventory ({snap.inventory.length})
            </p>
            {snap.inventory.length === 0 ? (
              <span className="text-muted small">None</span>
            ) : (
              <ul className="list-unstyled mb-0">
                {snap.inventory.map((c, i) => (
                  <li key={i} className="mb-2">
                    <div className="fw-medium small">{c.character_name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      Lv{c.level} · {c.mutation} · {c.trait}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Items */}
          <div className="col-12 col-md-4">
            <p className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>
              Items ({snap.items.length})
            </p>
            {snap.items.length === 0 ? (
              <span className="text-muted small">None</span>
            ) : (
              <ul className="list-unstyled mb-0">
                {snap.items.map((item, i) => (
                  <li key={i} className="mb-2">
                    <div className="fw-medium small">{item.item_name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>×{item.quantity}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Equipped */}
          <div className="col-12 col-md-4">
            <p className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>
              Equipped ({snap.equipped.length})
            </p>
            {snap.equipped.length === 0 ? (
              <span className="text-muted small">None</span>
            ) : (
              <ul className="list-unstyled mb-0">
                {snap.equipped.map((c, i) => (
                  <li key={i} className="mb-2">
                    <div className="fw-medium small">{c.character_name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      Lv{c.level} · {c.mutation} · {c.trait}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
  snapshots: PlayerSnapshotWithData[]
}

export function LogsTable({ snapshots }: Props) {
  const [selected, setSelected] = useState<PlayerSnapshotWithData | null>(null)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? snapshots.filter(
        (s) =>
          s.player_name.toLowerCase().includes(search.toLowerCase()) ||
          String(s.player_id).includes(search)
      )
    : snapshots

  return (
    <>
      {/* Search */}
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

      {/* Table */}
      <div className="table-responsive rounded border">
        <table className="table table-hover table-bordered mb-0" style={{ fontSize: 14 }}>
          <thead className="table-dark">
            <tr>
              <th>Player</th>
              <th className="text-end">Cash</th>
              <th className="text-end">Wave</th>
              <th className="text-end">Kills</th>
              <th>Batch Time</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">No snapshots found</td>
              </tr>
            )}
            {filtered.map((snap) => (
              <tr key={snap.id}>
                <td>
                  <div className="fw-medium">{snap.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{snap.player_id}</div>
                </td>
                <td className="text-end font-monospace">{snap.cash.toLocaleString()}</td>
                <td className="text-end font-monospace">{snap.highest_wave}</td>
                <td className="text-end font-monospace">{snap.total_kills.toLocaleString()}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{formatDate(snap.batch_timestamp)}</td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#snapshot-modal"
                    onClick={() => setSelected(snap)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Single shared modal */}
      <div className="modal fade" id="snapshot-modal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            {selected && <SnapshotModalBody snap={selected} />}
          </div>
        </div>
      </div>
    </>
  )
}
