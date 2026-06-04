'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function PlayersPage() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    // numeric input = search by player_id
    const isId = /^\d+$/.test(trimmed)
    router.push(isId ? `/players/id/${trimmed}` : `/players/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Player Lookup</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search by Roblox username or Player ID
        </p>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Username or Player ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={!query.trim()}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>
    </div>
  )
}
