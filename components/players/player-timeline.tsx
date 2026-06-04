'use client'

import { useState } from 'react'
import type { PlayerSnapshotWithData } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'
import { CharacterAvatar } from '@/components/character-avatar'

function fmt(iso: string) { return new Date(iso).toLocaleString() }

function SnapshotCol({ title, rows }: {
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
          {rows.map((row, i) => (
            <li key={i} className="mb-2 d-flex gap-2">
              {row.character_id && <CharacterAvatar name={row.name} size={32} />}
              <div style={{ minWidth: 0 }}>
                <div className="fw-medium small text-truncate">{row.name}</div>
                {row.character_id && (
                  <div className="text-muted font-monospace text-truncate" style={{ fontSize: 10 }}>{row.character_id}</div>
                )}
                <div className="text-muted" style={{ fontSize: 11 }}>{row.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SnapshotModal({ snap }: { snap: PlayerSnapshotWithData }) {
  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">{snap.player_name}</h5>
          <span className="text-muted small">#{snap.player_id} · {fmt(snap.batch_timestamp)}</span>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        <div className="row g-2 mb-4">
          {[
            { l: 'Cash',  v: snap.cash.toLocaleString() },
            { l: 'Wave',  v: snap.highest_wave },
            { l: 'Kills', v: snap.total_kills.toLocaleString() },
          ].map(({ l, v }) => (
            <div key={l} className="col-4">
              <div className="card text-center py-2">
                <div className="fw-bold font-monospace fs-5">{v}</div>
                <div className="text-muted small">{l}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="row g-3">
          <SnapshotCol title="Inventory" rows={snap.inventory.map(c => ({ name: c.character_name, character_id: c.character_id, detail: `Lv${c.level} · ${c.mutation} · ${c.trait}` }))} />
          <SnapshotCol title="Items"     rows={snap.items.map(i => ({ name: i.item_name, detail: `×${i.quantity}` }))} />
          <SnapshotCol title="Equipped"  rows={snap.equipped.map(c => ({ name: c.character_name, character_id: c.character_id, detail: `Lv${c.level} · ${c.mutation} · ${c.trait}` }))} />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
      </div>
    </>
  )
}

interface Props {
  username: string
  snapshots: PlayerSnapshotWithData[]
}

export function PlayerTimeline({ username, snapshots }: Props) {
  const [selected, setSelected] = useState<PlayerSnapshotWithData | null>(null)
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)

  if (snapshots.length === 0) {
    return (
      <div className="alert alert-secondary text-center">
        No snapshots found for <strong>{username}</strong>
      </div>
    )
  }

  const paginated = snapshots.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="mb-3" style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          Snapshot Timeline <span className="badge bg-secondary ms-1">{snapshots.length}</span>
        </span>
      </div>

      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Batch Time</th>
              <th className="text-end">Cash</th>
              <th className="text-end">Wave</th>
              <th className="text-end">Kills</th>
              <th className="d-none d-md-table-cell text-end">Items</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((snap, i) => (
              <tr key={snap.id}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td className="text-muted" style={{ fontSize: 13 }}>{fmt(snap.batch_timestamp)}</td>
                <td className="text-end font-monospace">{snap.cash.toLocaleString()}</td>
                <td className="text-end font-monospace">{snap.highest_wave}</td>
                <td className="text-end font-monospace">{snap.total_kills.toLocaleString()}</td>
                <td className="d-none d-md-table-cell text-end">
                  <span className="badge bg-primary-subtle text-primary-emphasis">{snap.inventory.length}</span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal" data-bs-target="#player-snapshot-modal"
                    onClick={() => setSelected(snap)}>···</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={snapshots.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />

      <div className="modal fade" id="player-snapshot-modal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            {selected && <SnapshotModal snap={selected} />}
          </div>
        </div>
      </div>
    </>
  )
}
