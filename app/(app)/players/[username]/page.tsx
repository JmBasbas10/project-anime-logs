import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { PlayerTimeline } from '@/components/players/player-timeline'
import type { PlayerEventWithSnapshot } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export default async function PlayerPage({ params }: Props) {
  const { username } = await params
  const decoded = decodeURIComponent(username)
  const isId = /^\d+$/.test(decoded)

  const supabase = createAdminSupabaseClient()

  const query = supabase
    .from('player_events')
    .select(`*, inventory:player_inventory(*), items:player_items(*), equipped:player_equipped(*)`)
    .order('created_at', { ascending: false })

  const { data, error } = await (isId
    ? query.eq('player_id', Number(decoded))
    : query.eq('player_name', decoded))

  if (error) notFound()

  const sessions = (data as PlayerEventWithSnapshot[]) ?? []
  const displayName = isId
    ? (sessions[0]?.player_name ?? `Player #${decoded}`)
    : decoded

  const latestLeave = sessions.find((s) => s.event_type === 'leave')
  const stats = latestLeave
    ? { cash: latestLeave.cash, wave: latestLeave.highest_wave, kills: latestLeave.total_kills }
    : null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/players"
          className="-ml-2 mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold">{displayName}</h1>
        {sessions[0] && (
          <p className="text-muted-foreground text-xs mt-0.5">
            Player ID: #{sessions[0].player_id}
          </p>
        )}
        <p className="text-muted-foreground text-sm mt-1">
          {sessions.length} event{sessions.length !== 1 ? 's' : ''} recorded
        </p>

        {stats && (
          <div className="flex gap-4 mt-4 text-sm flex-wrap">
            <StatBadge label="Cash" value={stats.cash.toLocaleString()} />
            <StatBadge label="Highest Wave" value={stats.wave.toString()} />
            <StatBadge label="Total Kills" value={stats.kills.toLocaleString()} />
          </div>
        )}
      </div>

      <PlayerTimeline username={displayName} sessions={sessions} />
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  )
}
