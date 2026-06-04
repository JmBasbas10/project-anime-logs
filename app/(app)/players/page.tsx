'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlayersPage() {
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
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Player Lookup</h2>
        <p className="text-muted small">Search by Roblox username or numeric Player ID</p>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-body">
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Username or Player ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={!query.trim()}>
              Search
            </button>
          </form>
          <p className="text-muted small mt-2 mb-0">
            Tip: entering a number searches by Player ID
          </p>
        </div>
      </div>
    </div>
  )
}
