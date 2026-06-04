'use client'

import { useState } from 'react'
import { Pagination } from '@/components/ui/pagination'

export interface CharacterSale {
  id: string
  player_name: string
  player_id: number
  character_name: string
  character_id: string
  level: number
  mutation: string
  cash_received: number
  created_at: string
}

function fmt(iso: string) { return new Date(iso).toLocaleString() }

function SaleModal({ sale }: { sale: CharacterSale }) {
  return (
    <>
      <div className="modal-header">
        <div>
          <h5 className="modal-title fw-bold mb-0">Sale Detail</h5>
          <span className="text-muted small">{sale.player_name} · #{sale.player_id}</span>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        <table className="table table-sm table-bordered small mb-0">
          <tbody>
            {[
              ['Player',    sale.player_name],
              ['Player ID', `#${sale.player_id}`],
              ['Character', sale.character_name],
              ['Char ID',   sale.character_id],
              ['Level',     sale.level],
              ['Mutation',  sale.mutation],
              ['Cash Received', sale.cash_received.toLocaleString()],
              ['Time',      fmt(sale.created_at)],
            ].map(([l, v]) => (
              <tr key={String(l)}><td className="text-muted fw-medium" style={{ width: 130 }}>{l}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="modal-footer">
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

  const filtered = search.trim()
    ? sales.filter(s =>
        s.player_name.toLowerCase().includes(search.toLowerCase()) ||
        s.character_name.toLowerCase().includes(search.toLowerCase()) ||
        String(s.player_id).includes(search)
      )
    : sales

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          All Sales <span className="badge bg-secondary ms-1">{sales.length}</span>
        </span>
        <div className="input-group input-group-sm" style={{ width: 260 }}>
          <span className="input-group-text bg-transparent">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search player or character…"
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
              <th>Character</th>
              <th>Level</th>
              <th>Mutation</th>
              <th className="text-end">Cash Received</th>
              <th>Time</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted py-5">No sales found</td></tr>
            )}
            {paginated.map((sale, i) => (
              <tr key={sale.id}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{sale.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{sale.player_id}</div>
                </td>
                <td>
                  <div className="fw-medium">{sale.character_name}</div>
                </td>
                <td className="font-monospace">{sale.level}</td>
                <td><span className="badge bg-info-subtle text-info-emphasis">{sale.mutation}</span></td>
                <td className="text-end font-monospace">{sale.cash_received.toLocaleString()}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{fmt(sale.created_at)}</td>
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

      <div className="modal fade" id="sale-modal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            {selected && <SaleModal sale={selected} />}
          </div>
        </div>
      </div>
    </>
  )
}
