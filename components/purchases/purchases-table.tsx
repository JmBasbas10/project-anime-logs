'use client'

import { useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { useArchive } from '@/lib/use-archive'

export interface ProductPurchase {
  id: string
  player_name: string
  player_id: number
  product_name: string
  robux_spent: number
  created_at: string
}

function fmt(iso: string) { return new Date(iso).toLocaleString() }

function PurchaseModal({ purchase, isArchived, onToggle }: {
  purchase: ProductPurchase
  isArchived: boolean
  onToggle: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  async function handle() { setLoading(true); await onToggle(); setLoading(false) }

  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">
            Purchase Detail
            {isArchived && <span className="badge bg-warning-subtle text-warning-emphasis ms-2">Archived</span>}
          </h5>
          <span className="text-muted small">{purchase.player_name} · #{purchase.player_id}</span>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        <table className="table table-sm table-bordered small mb-0">
          <tbody>
            {[
              ['Player',    purchase.player_name],
              ['Player ID', `#${purchase.player_id}`],
              ['Product',   purchase.product_name],
              ['Robux Spent', `R$ ${purchase.robux_spent.toLocaleString()}`],
              ['Time',      fmt(purchase.created_at)],
            ].map(([l, v]) => (
              <tr key={String(l)}><td className="text-muted fw-medium" style={{ width: 130 }}>{l}</td><td>{v}</td></tr>
            ))}
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

interface Props { purchases: ProductPurchase[] }

export function PurchasesTable({ purchases }: Props) {
  const [selected, setSelected] = useState<ProductPurchase | null>(null)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)
  const { archivedIds, showArchived, setShowArchived, toggle, visible, count } = useArchive('product_purchases', purchases)

  const filtered = purchases
    .filter(visible)
    .filter(p => !search.trim() ||
      p.player_name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      String(p.player_id).includes(search))

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalRobux = filtered.reduce((s, p) => s + p.robux_spent, 0)

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span className="fw-medium" style={{ fontSize: 14 }}>
            {showArchived ? 'Archived' : 'Active'} Purchases <span className="badge bg-secondary ms-1">{filtered.length}</span>
          </span>
          <span className="badge bg-success-subtle text-success-emphasis" style={{ fontSize: 12 }}>
            R$ {totalRobux.toLocaleString()} total
          </span>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 220 }}>
            <span className="input-group-text bg-transparent">🔍</span>
            <input type="text" className="form-control" placeholder="Search player or product…"
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
              <th>Player</th>
              <th>Product</th>
              <th className="text-end">Robux Spent</th>
              <th className="d-none d-md-table-cell">Time</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-5">No purchases found</td></tr>
            )}
            {paginated.map((p, i) => (
              <tr key={p.id} style={{ opacity: archivedIds.has(p.id) ? 0.5 : 1 }}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{p.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{p.player_id}</div>
                </td>
                <td><span className="badge bg-success-subtle text-success-emphasis">{p.product_name}</span></td>
                <td className="text-end font-monospace">R$ {p.robux_spent.toLocaleString()}</td>
                <td className="text-muted d-none d-md-table-cell" style={{ fontSize: 12 }}>{fmt(p.created_at)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal"
                    data-bs-target="#purchase-modal"
                    onClick={() => setSelected(p)}
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

      <div className="modal fade" id="purchase-modal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            {selected && <PurchaseModal purchase={selected} isArchived={archivedIds.has(selected.id)} onToggle={() => toggle(selected.id)} />}
          </div>
        </div>
      </div>
    </>
  )
}
