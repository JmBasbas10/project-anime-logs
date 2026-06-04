'use client'

import { useState } from 'react'
import type { GiftLog } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'
import { useArchive } from '@/lib/use-archive'

function fmt(iso: string) { return new Date(iso).toLocaleString() }

function GiftModal({ gift, isArchived, onToggle }: {
  gift: GiftLog
  isArchived: boolean
  onToggle: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  async function handle() { setLoading(true); await onToggle(); setLoading(false) }

  return (
    <>
      <div className="modal-header">
        <h5 className="modal-title fw-bold">
          Character Transfer
          {isArchived && <span className="badge bg-warning-subtle text-warning-emphasis ms-2">Archived</span>}
        </h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        {/* Transfer direction */}
        <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
          <div className="text-center">
            <div className="text-muted" style={{ fontSize: 11 }}>From</div>
            <div className="fw-medium">{gift.giver_name}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>#{gift.giver_id}</div>
          </div>
          <div className="fs-4 text-primary">→</div>
          <div className="text-center">
            <div className="text-muted" style={{ fontSize: 11 }}>To</div>
            <div className="fw-medium">{gift.receiver_name}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>#{gift.receiver_id}</div>
          </div>
        </div>

        <table className="table table-sm table-bordered small mb-0">
          <tbody>
            <tr><td className="text-muted fw-medium" style={{ width: 130 }}>Character</td><td>{gift.character_name}</td></tr>
            <tr><td className="text-muted fw-medium">Character ID</td><td className="font-monospace" style={{ fontSize: 11 }}>{gift.character_id}</td></tr>
            <tr><td className="text-muted fw-medium">Level</td><td className="font-monospace">{gift.level}</td></tr>
            <tr><td className="text-muted fw-medium">Mutation</td><td><span className="badge bg-primary-subtle text-primary-emphasis">{gift.mutation}</span></td></tr>
            <tr><td className="text-muted fw-medium">Trait</td><td><span className="badge bg-secondary-subtle text-secondary-emphasis">{gift.trait ?? '—'}</span></td></tr>
            <tr><td className="text-muted fw-medium">Time</td><td>{fmt(gift.created_at)}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="modal-footer justify-content-between">
        <button className={`btn btn-sm ${isArchived ? 'btn-outline-success' : 'btn-outline-warning'}`}
          onClick={handle} disabled={loading}>
          {loading ? '…' : isArchived ? '↩ Unarchive' : '🗄 Archive'}
        </button>
        <button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
      </div>
    </>
  )
}

interface Props { gifts: GiftLog[] }

export function GiftsTable({ gifts }: Props) {
  const [selected, setSelected] = useState<GiftLog | null>(null)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)
  const { archivedIds, showArchived, setShowArchived, toggle, visible, count } = useArchive('gift_logs', gifts)

  const filtered = gifts
    .filter(visible)
    .filter(g => !search.trim() ||
      g.giver_name.toLowerCase().includes(search.toLowerCase()) ||
      g.receiver_name.toLowerCase().includes(search.toLowerCase()) ||
      g.character_name.toLowerCase().includes(search.toLowerCase()) ||
      String(g.giver_id).includes(search) ||
      String(g.receiver_id).includes(search))

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          {showArchived ? 'Archived' : 'Active'} Transfers <span className="badge bg-secondary ms-1">{filtered.length}</span>
        </span>
        <div className="d-flex gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 240 }}>
            <span className="input-group-text bg-transparent">🔍</span>
            <input type="text" className="form-control" placeholder="Search giver, receiver, character…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <button className={`btn btn-sm ${showArchived ? 'btn-warning' : 'btn-outline-secondary'}`}
            onClick={() => { setShowArchived(v => !v); setPage(1) }}>
            🗄 {showArchived ? `Archived (${count})` : `Archive (${count})`}
          </button>
        </div>
      </div>

      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Transfer</th>
              <th>Character</th>
              <th className="d-none d-md-table-cell text-end">Level</th>
              <th className="d-none d-md-table-cell">Mutation</th>
              <th className="d-none d-lg-table-cell">Trait</th>
              <th className="d-none d-lg-table-cell">Time</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted py-5">No transfers found</td></tr>
            )}
            {paginated.map((gift, i) => (
              <tr key={gift.id} style={{ opacity: archivedIds.has(gift.id) ? 0.5 : 1 }}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                    <span className="fw-medium">{gift.giver_name}</span>
                    <span className="text-primary">→</span>
                    <span className="fw-medium">{gift.receiver_name}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 11 }}>#{gift.giver_id} → #{gift.receiver_id}</div>
                </td>
                <td className="fw-medium">{gift.character_name}</td>
                <td className="d-none d-md-table-cell text-end font-monospace">{gift.level}</td>
                <td className="d-none d-md-table-cell"><span className="badge bg-primary-subtle text-primary-emphasis">{gift.mutation}</span></td>
                <td className="d-none d-lg-table-cell"><span className="badge bg-secondary-subtle text-secondary-emphasis">{gift.trait ?? '—'}</span></td>
                <td className="text-muted d-none d-lg-table-cell" style={{ fontSize: 12 }}>{fmt(gift.created_at)}</td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal" data-bs-target="#gift-modal"
                    onClick={() => setSelected(gift)}>···</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={filtered.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />

      <div className="modal fade" id="gift-modal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            {selected && <GiftModal gift={selected} isArchived={archivedIds.has(selected.id)} onToggle={() => toggle(selected.id)} />}
          </div>
        </div>
      </div>
    </>
  )
}
