import type { PlayerEventWithSnapshot } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

interface Props {
  username: string
  sessions: PlayerEventWithSnapshot[]
}

export function PlayerTimeline({ username, sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-md border p-10 text-center text-muted-foreground">
        No sessions found for <span className="font-medium text-foreground">{username}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant={session.event_type === 'join' ? 'default' : 'secondary'}>
                  {session.event_type}
                </Badge>
                {formatDate(session.created_at)}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {formatDuration(session.session_duration_seconds)}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Stat label="Cash" value={session.cash.toLocaleString()} />
              <Stat label="Highest Wave" value={session.highest_wave.toString()} />
              <Stat label="Total Kills" value={session.total_kills.toLocaleString()} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <SnapshotBlock
                title="Inventory"
                rows={session.inventory.map((c) => ({
                  name: c.character_name,
                  detail: `Lv${c.level} · ${c.mutation} · ${c.trait}`,
                }))}
              />
              <SnapshotBlock
                title="Items"
                rows={session.items.map((i) => ({
                  name: i.item_name,
                  detail: `×${i.quantity}`,
                }))}
              />
              <SnapshotBlock
                title="Equipped"
                rows={session.equipped.map((c) => ({
                  name: c.character_name,
                  detail: `Lv${c.level} · ${c.mutation} · ${c.trait}`,
                }))}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function SnapshotBlock({ title, rows }: { title: string; rows: { name: string; detail: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">None</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row, i) => (
            <li key={i}>
              <span className="font-medium">{row.name}</span>
              <span className="text-muted-foreground ml-2 text-xs">{row.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
