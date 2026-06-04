'use client'

import { useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { useArchive } from '@/lib/use-archive'
import { CharacterAvatar } from '@/components/character-avatar'

export interface SaleCharacter {
  id: string
  sale_id: string
  character_name: string
  character_id: string
  level: number
  mutation: string
  trait: string
  cash_received: number
}

export interface CharacterSale {
  id: string
  player_name: string
  player_id: number
  sale_type: 'SellOne' | 'SellAll'
  total_cash_received: number
  total_sold: number
  created_at: string
  characters: SaleCharacter[]
}

function fmt(iso: string) { return new Date(iso).toLocaleString() }

function SaleModal({ sale, isArchived, onToggle }: {
  sale: CharacterSale
  isArchived: boolean
  onToggle: () => Promise<void>
}) {
  const chars = sale.characters ?? []
  const [loading, setLoading] = useState(false)
  async function handle() { setLoading(true); await onToggle(); setLoading(false) }

  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">{sale.player_name}</h5>
          <span className="text-muted small">
            #{sale.player_id} ·{' '}
            <span className={`badge rounded-pill ms-1 ${
              sale.sale_type === 'SellAll'
                ? 'bg-warning-subtle text-warning-emphasis'
                : 'bg-info-subtle text-info-emphasis'
            }`}>
              {sale.sale_type}
            </span>
            {isArchived && <span className="badge bg-warning-subtle text-warning-emphasis ms-1">Archived</span>}
          </span>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        {/* Summary stats */}
        <div className="row g-2 mb-4">
          {[
            { l: 'Characters Sold', v: sale.total_sold ?? 0 },
            { l: 'Total Cash',      v: (sale.total_cash_received ?? 0).toLocaleString() },
            { l: 'Time',            v: fmt(sale.created_at) },
          ].map(({ l, v }) => (
            <div key={l} className="col">
              <div className="card text-center py-2 px-1">
                <div className="fw-bold font-monospace">{v}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Characters breakdown */}
        <p className="fw-semibold text-uppercase text-muted mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>
          Characters ({chars.length})
        </p>
        {chars.length === 0 ? (
          <div className="text-muted small">No character data</div>
        ) : (
          <table className="table table-sm table-bordered mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
              <tr>
                <th>Character</th>
                <th className="text-muted" style={{ fontSize: 11 }}>ID</th>
                <th>Level</th>
                <th>Mutation</th>
                <th>Trait</th>
                <th className="text-end">Cash</th>
              </tr>
            </thead>
            <tbody>
              {chars.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <CharacterAvatar name={c.character_name} size={28} />
                      <span className="fw-medium">{c.character_name}</span>
                    </div>
                  </td>
                  <td className="text-muted font-monospace" style={{ fontSize: 11 }}>{c.character_id}</td>
                  <td className="font-monospace">{c.level}</td>
                  <td>
                    <span className="badge bg-primary-subtle text-primary-emphasis">{c.mutation}</span>
                  </td>
                  <td>
                    <span className="badge bg-secondary-subtle text-secondary-emphasis">{c.trait ?? '—'}</span>
                  </td>
                  <td className="text-end font-monospace">{c.cash_received.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

interface Props { sales: CharacterSale[] }

export function SalesTable({ sales }: Props) {
  const [selected, setSelected] = useState<CharacterSale | null>(null)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)
  const { archivedIds, showArchived, setShowArchived, toggle, visible, count } = useArchive('character_sales', sales)

  const filtered = sales
    .filter(visible)
    .filter(s => !search.trim() ||
      s.player_name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.player_id).includes(search) ||
      (s.characters ?? []).some(c => c.character_name.toLowerCase().includes(search.toLowerCase())))

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          {showArchived ? 'Archived' : 'Active'} Sales <span className="badge bg-secondary ms-1">{filtered.length}</span>
        </span>
        <div className="d-flex gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 220 }}>
            <span className="input-group-text bg-transparent">🔍</span>
            <input type="text" className="form-control" placeholder="Search player or character…"
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
              <th>Type</th>
              <th className="text-end">Sold</th>
              <th className="text-end">Cash Received</th>
              <th className="d-none d-md-table-cell">Time</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-5">No sales found</td></tr>
            )}
            {paginated.map((sale, i) => (
              <tr key={sale.id} style={{ opacity: archivedIds.has(sale.id) ? 0.5 : 1 }}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{sale.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{sale.player_id}</div>
                </td>
                <td>
                  <span className={`badge rounded-pill ${
                    sale.sale_type === 'SellAll'
                      ? 'bg-warning-subtle text-warning-emphasis'
                      : 'bg-info-subtle text-info-emphasis'
                  }`}>
                    {sale.sale_type}
                  </span>
                </td>
                <td className="text-end font-monospace">{(sale.total_sold ?? 0)}</td>
                <td className="text-end font-monospace">{(sale.total_cash_received ?? 0).toLocaleString()}</td>
                <td className="text-muted d-none d-md-table-cell" style={{ fontSize: 12 }}>{fmt(sale.created_at)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal"
                    data-bs-target="#sale-modal"
                    onClick={() => setSelected(sale)}
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

      {/* Shared modal */}
      <div className="modal fade" id="sale-modal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            {selected && <SaleModal sale={selected} isArchived={archivedIds.has(selected.id)} onToggle={() => toggle(selected.id)} />}
          </div>
        </div>
      </div>
    </>
  )
}
