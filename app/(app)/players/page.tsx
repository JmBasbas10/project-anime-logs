'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function PlayersPage() {
  const [username, setUsername] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (trimmed) router.push(`/players/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Player Lookup</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search for a player to view their full session history
        </p>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Enter Roblox username…"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={!username.trim()}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>
    </div>
  )
}
