'use client'

import { useState } from 'react'

type ArchiveTable =
  | 'player_events'
  | 'player_snapshots'
  | 'character_sales'
  | 'gift_logs'
  | 'product_purchases'

interface HasIdArchived {
  id: string
  archived?: boolean
}

// Manages a local set of archived row IDs and syncs changes to /api/archive.
export function useArchive<T extends HasIdArchived>(table: ArchiveTable, rows: T[]) {
  const [archivedIds, setArchivedIds] = useState<Set<string>>(
    () => new Set(rows.filter(r => r.archived).map(r => r.id))
  )
  const [showArchived, setShowArchived] = useState(false)

  async function toggle(id: string) {
    const willArchive = !archivedIds.has(id)
    setArchivedIds(prev => {
      const next = new Set(prev)
      willArchive ? next.add(id) : next.delete(id)
      return next
    })
    await fetch('/api/archive', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, archived: willArchive }),
    })
  }

  const visible = (r: T) => (showArchived ? archivedIds.has(r.id) : !archivedIds.has(r.id))

  return { archivedIds, showArchived, setShowArchived, toggle, visible, count: archivedIds.size }
}
