'use client'

import { Fragment, useState } from 'react'
import type { PlayerEventWithSnapshot } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

function SnapshotSection({
  title,
  rows,
}: {
  title: string
  rows: { name: string; detail: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{row.name}</span>
              <span className="text-muted-foreground ml-2 text-xs">{row.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface Props {
  events: PlayerEventWithSnapshot[]
}

export function LogsTable({ events }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Player</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="text-right">Cash</TableHead>
            <TableHead className="text-right">Wave</TableHead>
            <TableHead className="text-right">Kills</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                No events found
              </TableCell>
            </TableRow>
          )}
          {events.map((event) => {
            const isOpen = expanded.has(event.id)
            return (
              <Fragment key={event.id}>
                <TableRow
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => toggle(event.id)}
                >
                  <TableCell className="text-muted-foreground">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{event.player_name}</TableCell>
                  <TableCell>
                    <Badge variant={event.event_type === 'join' ? 'default' : 'secondary'}>
                      {event.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {event.cash.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{event.highest_wave}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {event.total_kills.toLocaleString()}
                  </TableCell>
                  <TableCell>{formatDuration(event.session_duration_seconds)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(event.created_at)}
                  </TableCell>
                </TableRow>

                {isOpen && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-muted/20 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SnapshotSection
                          title="Inventory"
                          rows={event.inventory.map((c) => ({
                            name: c.character_name,
                            detail: `Lv${c.level} · ${c.mutation} · ${c.trait}`,
                          }))}
                        />
                        <SnapshotSection
                          title="Items"
                          rows={event.items.map((i) => ({
                            name: i.item_name,
                            detail: `×${i.quantity}`,
                          }))}
                        />
                        <SnapshotSection
                          title="Equipped"
                          rows={event.equipped.map((c) => ({
                            name: c.character_name,
                            detail: `Lv${c.level} · ${c.mutation} · ${c.trait}`,
                          }))}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
