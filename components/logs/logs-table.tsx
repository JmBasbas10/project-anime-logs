'use client'

import { useState } from 'react'
import type { PlayerSnapshotWithData } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'

function fmt(iso: string) { return new Date(iso).toLocaleString() }

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
          {[
            { title: `Inventory (${snap.inventory.length})`, rows: snap.inventory.map(c => ({ n: c.character_name, id: c.character_id, d: `Lv${c.level} · ${c.mutation} · ${c.trait}` })) },
            { title: `Items (${snap.items.length})`,         rows: snap.items.map(i => ({ n: i.item_name, id: null, d: `×${i.quantity}` })) },
            { title: `Equipped (${snap.equipped.length})`,   rows: snap.equipped.map(c => ({ n: c.character_name, id: c.character_id, d: `Lv${c.level} · ${c.mutation} · ${c.trait}` })) },
          ].map(({ title, rows }) => (
            <div key={title} className="col-12 col-md-4">
              <p className="fw-semibold text-uppercase text-muted mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>{title}</p>
              {rows.length === 0 ? <span className="text-muted small">None</span> : (
                <ul className="list-unstyled mb-0">
                  {rows.map((r, i) => (
                    <li key={i} className="mb-2">
                      <div className="fw-medium small">{r.n}</div>
                      {r.id && <div className="text-muted font-monospace" style={{ fontSize: 10 }}>{r.id}</div>}
                      <div className="text-muted" style={{ fontSize: 11 }}>{r.d}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
      </div>
    </>
  )
}

interface Props { snapshots: PlayerSnapshotWithData[] }

export function LogsTable({ snapshots }: Props) {
  const [selected, setSelected] = useState<PlayerSnapshotWithData | null>(null)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(10)

  const filtered = search.trim()
    ? snapshots.filter(s =>
        s.player_name.toLowerCase().includes(search.toLowerCase()) ||
        String(s.player_id).includes(search)
      )
    : snapshots

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          All Snapshots <span className="badge bg-secondary ms-1">{snapshots.length}</span>
        </span>
        <div className="input-group input-group-sm" style={{ width: 260 }}>
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

      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Player</th>
              <th className="text-end">Cash</th>
              <th className="text-end">Wave</th>
              <th className="text-end">Kills</th>
              <th>Batch Time</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-5">No snapshots found</td></tr>
            )}
            {paginated.map((snap, i) => (
              <tr key={snap.id}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{snap.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{snap.player_id}</div>
                </td>
                <td className="text-end font-monospace">{snap.cash.toLocaleString()}</td>
                <td className="text-end font-monospace">{snap.highest_wave}</td>
                <td className="text-end font-monospace">{snap.total_kills.toLocaleString()}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{fmt(snap.batch_timestamp)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal"
                    data-bs-target="#snapshot-modal"
                    onClick={() => setSelected(snap)}
                  >
                    ···
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={filtered.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />

      <div className="modal fade" id="snapshot-modal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            {selected && <SnapshotModal snap={selected} />}
          </div>
        </div>
      </div>
    </>
  )
}
