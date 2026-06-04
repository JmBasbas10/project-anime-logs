'use client'

import { useState } from 'react'
import type { GiftLog } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

interface Props {
  gifts: GiftLog[]
}

export function GiftsTable({ gifts }: Props) {
  const [selected, setSelected] = useState<GiftLog | null>(null)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? gifts.filter(
        (g) =>
          g.player_name.toLowerCase().includes(search.toLowerCase()) ||
          g.gift_item.toLowerCase().includes(search.toLowerCase()) ||
          String(g.player_id).includes(search)
      )
    : gifts

  return (
    <>
      <div className="mb-3">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Filter by player or item…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      <div className="table-responsive rounded border">
        <table className="table table-hover table-bordered mb-0" style={{ fontSize: 14 }}>
          <thead className="table-dark">
            <tr>
              <th>Player</th>
              <th>Item</th>
              <th className="text-end">Value</th>
              <th>Time</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">No gift logs found</td>
              </tr>
            )}
            {filtered.map((gift) => (
              <tr key={gift.id}>
                <td>
                  <div className="fw-medium">{gift.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{gift.player_id}</div>
                </td>
                <td><span className="badge bg-warning text-dark">{gift.gift_item}</span></td>
                <td className="text-end font-monospace">{gift.gift_value.toLocaleString()}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{formatDate(gift.created_at)}</td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#gift-modal"
                    onClick={() => setSelected(gift)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <div className="modal fade" id="gift-modal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            {selected && (
              <>
                <div className="modal-header">
                  <h5 className="modal-title">Gift Detail</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" />
                </div>
                <div className="modal-body">
                  <table className="table table-sm table-bordered small mb-0">
                    <tbody>
                      <tr><td className="text-muted fw-medium" style={{ width: 130 }}>Player</td><td>{selected.player_name}</td></tr>
                      <tr><td className="text-muted fw-medium">Player ID</td><td>#{selected.player_id}</td></tr>
                      <tr><td className="text-muted fw-medium">Item</td><td>{selected.gift_item}</td></tr>
                      <tr><td className="text-muted fw-medium">Value</td><td className="font-monospace">{selected.gift_value.toLocaleString()}</td></tr>
                      <tr><td className="text-muted fw-medium">Time</td><td>{formatDate(selected.created_at)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
