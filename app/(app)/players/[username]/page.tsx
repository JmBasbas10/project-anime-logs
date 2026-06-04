import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
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

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('player_events')
    .select(`*, inventory:player_inventory(*), items:player_items(*), equipped:player_equipped(*)`)
    .eq('player_name', decoded)
    .order('created_at', { ascending: false })

  if (error) notFound()

  const sessions = (data as PlayerEventWithSnapshot[]) ?? []

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

        <h1 className="text-2xl font-bold">{decoded}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded
        </p>

        {stats && (
          <div className="flex gap-6 mt-4 text-sm">
            <StatBadge label="Cash" value={stats.cash.toLocaleString()} />
            <StatBadge label="Highest Wave" value={stats.wave.toString()} />
            <StatBadge label="Total Kills" value={stats.kills.toLocaleString()} />
          </div>
        )}
      </div>

      <PlayerTimeline username={decoded} sessions={sessions} />
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
