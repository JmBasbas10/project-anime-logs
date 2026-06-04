'use client'

import { useState } from 'react'
import type { GiftLog } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'

function fmt(iso: string) { return new Date(iso).toLocaleString() }

function GiftModal({ gift }: { gift: GiftLog }) {
  return (
    <>
      <div className="modal-header">
        <h5 className="modal-title fw-bold">Gift Detail</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" />
      </div>
      <div className="modal-body">
        <table className="table table-sm table-bordered small mb-0">
          <tbody>
            {[
              ['Player', gift.player_name],
              ['Player ID', `#${gift.player_id}`],
              ['Item', gift.gift_item],
              ['Value', gift.gift_value.toLocaleString()],
              ['Time', fmt(gift.created_at)],
            ].map(([l, v]) => (
              <tr key={l}><td className="text-muted fw-medium" style={{ width: 120 }}>{l}</td><td>{v}</td></tr>
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

interface Props { gifts: GiftLog[] }

export function GiftsTable({ gifts }: Props) {
  const [selected, setSelected] = useState<GiftLog | null>(null)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)

  const filtered = search.trim()
    ? gifts.filter(g =>
        g.player_name.toLowerCase().includes(search.toLowerCase()) ||
        g.gift_item.toLowerCase().includes(search.toLowerCase()) ||
        String(g.player_id).includes(search)
      )
    : gifts

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          All Gifts <span className="badge bg-secondary ms-1">{gifts.length}</span>
        </span>
        <div className="input-group input-group-sm" style={{ width: 260 }}>
          <span className="input-group-text bg-transparent">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search player or item…"
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
              <th>Item</th>
              <th className="text-end">Value</th>
              <th>Time</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-5">No gifts found</td></tr>
            )}
            {paginated.map((gift, i) => (
              <tr key={gift.id}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{gift.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{gift.player_id}</div>
                </td>
                <td><span className="badge bg-warning-subtle text-warning-emphasis">{gift.gift_item}</span></td>
                <td className="text-end font-monospace">{gift.gift_value.toLocaleString()}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{fmt(gift.created_at)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="modal"
                    data-bs-target="#gift-modal"
                    onClick={() => setSelected(gift)}
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

      <div className="modal fade" id="gift-modal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            {selected && <GiftModal gift={selected} />}
          </div>
        </div>
      </div>
    </>
  )
}
