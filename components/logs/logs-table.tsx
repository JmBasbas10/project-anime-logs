'use client'

import { useState } from 'react'
import type { PlayerSnapshotWithData } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'
import { CharacterAvatar } from '@/components/character-avatar'

function fmt(iso: string) { return new Date(iso).toLocaleString() }

async function toggleArchive(id: string, archived: boolean) {
  await fetch('/api/archive', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'player_snapshots', id, archived }),
  })
}

function SnapshotModal({ snap, isArchived, onArchiveToggle }: {
  snap: PlayerSnapshotWithData
  isArchived: boolean
  onArchiveToggle: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await toggleArchive(snap.id, !isArchived)
    onArchiveToggle()
    setLoading(false)
  }

  const sections = [
    { title: `Inventory (${snap.inventory.length})`, rows: snap.inventory.map(c => ({ n: c.character_name, id: c.character_id, d: `Lv${c.level} · ${c.mutation} · ${c.trait}` })) },
    { title: `Items (${snap.items.length})`,         rows: snap.items.map(i => ({ n: i.item_name, id: null,            d: `×${i.quantity}` })) },
    { title: `Equipped (${snap.equipped.length})`,   rows: snap.equipped.map(c => ({ n: c.character_name, id: c.character_id, d: `Lv${c.level} · ${c.mutation} · ${c.trait}` })) },
  ]

  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">{snap.player_name}</h5>
          <span className="text-muted small">#{snap.player_id} · {fmt(snap.batch_timestamp)}</span>
          {isArchived && <span className="badge bg-warning-subtle text-warning-emphasis ms-2">Archived</span>}
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        <div className="row g-2 mb-4">
          {[{ l: 'Cash', v: snap.cash.toLocaleString() }, { l: 'Wave', v: snap.highest_wave }, { l: 'Kills', v: snap.total_kills.toLocaleString() }].map(({ l, v }) => (
            <div key={l} className="col-4">
              <div className="card text-center py-2">
                <div className="fw-bold font-monospace fs-5">{v}</div>
                <div className="text-muted small">{l}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="row g-3">
          {sections.map(({ title, rows }) => (
            <div key={title} className="col-12 col-md-4">
              <p className="fw-semibold text-uppercase text-muted mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>{title}</p>
              {rows.length === 0 ? <span className="text-muted small">None</span> : (
                <ul className="list-unstyled mb-0">
                  {rows.map((r, i) => (
                    <li key={i} className="mb-2 d-flex gap-2">
                      {r.id && <CharacterAvatar name={r.n} size={32} />}
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-medium small text-truncate">{r.n}</div>
                        {r.id && <div className="text-muted font-monospace text-truncate" style={{ fontSize: 10 }}>{r.id}</div>}
                        <div className="text-muted" style={{ fontSize: 11 }}>{r.d}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="modal-footer justify-content-between">
        <button className={`btn btn-sm ${isArchived ? 'btn-outline-success' : 'btn-outline-warning'}`}
          onClick={handleToggle} disabled={loading}>
          {loading ? '…' : isArchived ? '↩ Unarchive' : '🗄 Archive'}
        </button>
        <button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
      </div>
    </>
  )
}

interface Props { snapshots: PlayerSnapshotWithData[] }

export function LogsTable({ snapshots }: Props) {
  const [selected, setSelected]         = useState<PlayerSnapshotWithData | null>(null)
  const [search, setSearch]             = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [archivedIds, setArchivedIds]   = useState<Set<string>>(
    () => new Set(snapshots.filter((s: PlayerSnapshotWithData & { archived?: boolean }) => s.archived).map(s => s.id))
  )
  const [page, setPage]                 = useState(1)
  const [perPage, setPerPage]           = useState(10)

  function toggleLocal(id: string) {
    setArchivedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const afterArchive = showArchived ? snapshots.filter(s => archivedIds.has(s.id)) : snapshots.filter(s => !archivedIds.has(s.id))
  const filtered     = search.trim() ? afterArchive.filter(s =>
    s.player_name.toLowerCase().includes(search.toLowerCase()) || String(s.player_id).includes(search)
  ) : afterArchive
  const paginated    = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          {showArchived ? 'Archived' : 'Active'} Snapshots <span className="badge bg-secondary ms-1">{filtered.length}</span>
        </span>
        <div className="d-flex gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 220 }}>
            <span className="input-group-text bg-transparent">🔍</span>
            <input type="text" className="form-control" placeholder="Search player or ID…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <button className={`btn btn-sm ${showArchived ? 'btn-warning' : 'btn-outline-secondary'}`}
            onClick={() => { setShowArchived(v => !v); setPage(1) }}>
            🗄 {showArchived ? `Archived (${archivedIds.size})` : `Archive (${archivedIds.size})`}
          </button>
        </div>
      </div>

      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Player</th>
              <th className="text-end">Cash</th><th className="text-end">Wave</th><th className="text-end">Kills</th>
              <th className="d-none d-lg-table-cell">Batch Time</th>
              <th style={{ width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-5">No snapshots found</td></tr>}
            {paginated.map((snap, i) => (
              <tr key={snap.id} style={{ opacity: archivedIds.has(snap.id) ? 0.5 : 1 }}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{snap.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{snap.player_id}</div>
                </td>
                <td className="text-end font-monospace">{snap.cash.toLocaleString()}</td>
                <td className="text-end font-monospace">{snap.highest_wave}</td>
                <td className="text-end font-monospace">{snap.total_kills.toLocaleString()}</td>
                <td className="text-muted d-none d-lg-table-cell" style={{ fontSize: 12 }}>{fmt(snap.batch_timestamp)}</td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal" data-bs-target="#snapshot-modal"
                    onClick={() => setSelected(snap)}>···</button>
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
            {selected && <SnapshotModal snap={selected} isArchived={archivedIds.has(selected.id)} onArchiveToggle={() => toggleLocal(selected.id)} />}
          </div>
        </div>
      </div>
    </>
  )
}
