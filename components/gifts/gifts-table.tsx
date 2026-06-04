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
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? gifts.filter(
        (g) =>
          g.player_name.toLowerCase().includes(search.toLowerCase()) ||
          g.gift_item.toLowerCase().includes(search.toLowerCase())
      )
    : gifts

  return (
    <div>
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

      <div className="table-responsive">
        <table className="table table-dark table-hover table-bordered align-middle mb-0">
          <thead className="table-secondary">
            <tr>
              <th>Player</th>
              <th>Item</th>
              <th className="text-end">Value</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  No gift logs found
                </td>
              </tr>
            )}
            {filtered.map((gift) => (
              <tr key={gift.id}>
                <td>
                  <div className="fw-medium">{gift.player_name}</div>
                  <div className="text-muted small">#{gift.player_id}</div>
                </td>
                <td>
                  <span className="badge bg-warning text-dark">{gift.gift_item}</span>
                </td>
                <td className="text-end font-monospace">{gift.gift_value.toLocaleString()}</td>
                <td className="text-muted small">{formatDate(gift.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
