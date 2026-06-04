'use client'

import { Fragment, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'

export interface SaleCharacter {
  id: string
  sale_id: string
  character_name: string
  character_id: string
  level: number
  mutation: string
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

interface Props { sales: CharacterSale[] }

export function SalesTable({ sales }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = search.trim()
    ? sales.filter(s =>
        s.player_name.toLowerCase().includes(search.toLowerCase()) ||
        String(s.player_id).includes(search) ||
        (s.characters ?? []).some(c => c.character_name.toLowerCase().includes(search.toLowerCase()))
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
              <th style={{ width: 32 }} />
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Player</th>
              <th>Type</th>
              <th className="text-end">Sold</th>
              <th className="text-end">Cash Received</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-5">No sales found</td></tr>
            )}
            {paginated.map((sale, i) => {
              const isOpen = expanded.has(sale.id)
              return (
                <Fragment key={sale.id}>
                  <tr
                    role="button"
                    onClick={() => toggle(sale.id)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <td className="text-center text-muted" style={{ fontSize: 12 }}>
                      {isOpen ? '▼' : '▶'}
                    </td>
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
                    <td className="text-end font-monospace">{sale.total_sold}</td>
                    <td className="text-end font-monospace">{sale.total_cash_received.toLocaleString()}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{fmt(sale.created_at)}</td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--bs-border-color-translucent)' }}>
                          {(sale.characters ?? []).length === 0 ? (
                            <span className="text-muted small">No character data</span>
                          ) : (
                            <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                              <thead>
                                <tr>
                                  <th className="text-muted fw-normal">Character</th>
                                  <th className="text-muted fw-normal">Level</th>
                                  <th className="text-muted fw-normal">Mutation</th>
                                  <th className="text-muted fw-normal text-end">Cash</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(sale.characters ?? []).map(c => (
                                  <tr key={c.id}>
                                    <td className="fw-medium">{c.character_name}</td>
                                    <td className="font-monospace">{c.level}</td>
                                    <td>
                                      <span className="badge bg-primary-subtle text-primary-emphasis">
                                        {c.mutation}
                                      </span>
                                    </td>
                                    <td className="text-end font-monospace">{c.cash_received.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
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

      <Pagination page={page} total={filtered.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />
    </>
  )
}
