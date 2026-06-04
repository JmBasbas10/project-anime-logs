import type { Server } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server as ServerIcon, Users } from 'lucide-react'

function timeSince(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

interface Props {
  servers: Server[]
}

export function ServersList({ servers }: Props) {
  if (servers.length === 0) {
    return (
      <div className="rounded-md border p-10 text-center text-muted-foreground">
        No active servers
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {servers.map((server) => (
        <Card key={server.id}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ServerIcon className="h-4 w-4 text-muted-foreground" />
              {server.server_id.slice(0, 12)}…
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {timeSince(server.last_ping)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-2xl font-bold">
              <Users className="h-5 w-5 text-muted-foreground" />
              {server.player_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">players online</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
