'use client'

import { useState } from 'react'
import type { PlayerSnapshotWithData } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

interface Props {
  username: string
  snapshots: PlayerSnapshotWithData[]
}

export function PlayerTimeline({ username, snapshots }: Props) {
  const [openId, setOpenId] = useState<string | null>(snapshots[0]?.id ?? null)

  if (snapshots.length === 0) {
    return (
      <div className="alert alert-secondary text-center">
        No snapshots found for <strong>{username}</strong>
      </div>
    )
  }

  return (
    <div className="accordion accordion-flush" id="timeline-accordion">
      {snapshots.map((snap) => {
        const isOpen = openId === snap.id
        return (
          <div key={snap.id} className="accordion-item">
            <h2 className="accordion-header">
              <button
                className={`accordion-button ${isOpen ? '' : 'collapsed'}`}
                type="button"
                onClick={() => setOpenId(isOpen ? null : snap.id)}
              >
                <div className="d-flex align-items-center gap-3 flex-wrap w-100 me-3">
                  <span className="text-muted small">{formatDate(snap.batch_timestamp)}</span>
                  <span className="badge bg-secondary font-monospace">
                    💰 {snap.cash.toLocaleString()}
                  </span>
                  <span className="badge bg-primary font-monospace">
                    🌊 Wave {snap.highest_wave}
                  </span>
                  <span className="badge bg-danger font-monospace">
                    ⚔️ {snap.total_kills.toLocaleString()} kills
                  </span>
                </div>
              </button>
            </h2>
            <div className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`}>
              <div className="accordion-body">
                <div className="row g-3">
                  <SnapshotCol
                    title="Inventory"
                    rows={snap.inventory.map((c) => ({
                      name: c.character_name,
                      character_id: c.character_id,
                      detail: `Lv${c.level} · ${c.mutation} · ${c.trait}`,
                    }))}
                  />
                  <SnapshotCol
                    title="Items"
                    rows={snap.items.map((i) => ({
                      name: i.item_name,
                      detail: `×${i.quantity}`,
                    }))}
                  />
                  <SnapshotCol
                    title="Equipped"
                    rows={snap.equipped.map((c) => ({
                      name: c.character_name,
                      character_id: c.character_id,
                      detail: `Lv${c.level} · ${c.mutation} · ${c.trait}`,
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SnapshotCol({ title, rows }: {
  title: string
  rows: { name: string; character_id?: string; detail: string }[]
}) {
  return (
    <div className="col-12 col-md-4">
      <p className="text-uppercase text-muted small fw-semibold mb-2">{title}</p>
      {rows.length === 0 ? (
        <span className="text-muted small">None</span>
      ) : (
        <ul className="list-unstyled mb-0">
          {rows.map((row, i) => (
            <li key={i} className="mb-2">
              <div className="fw-medium small">{row.name}</div>
              {row.character_id && (
                <div className="text-muted font-monospace" style={{ fontSize: 10 }}>{row.character_id}</div>
              )}
              <div className="text-muted" style={{ fontSize: 11 }}>{row.detail}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
