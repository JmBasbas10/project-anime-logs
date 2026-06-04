'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PlayerSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const isId = /^\d+$/.test(trimmed)
    router.push(isId ? `/players/id/${trimmed}` : `/players/${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={handleSearch} className="d-flex gap-2" style={{ minWidth: 300 }}>
      <div className="input-group input-group-sm">
        <span className="input-group-text bg-transparent">🔍</span>
        <input
          type="text"
          className="form-control"
          placeholder="Jump to username or Player ID…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!query.trim()}>
          Go
        </button>
      </div>
    </form>
  )
}
