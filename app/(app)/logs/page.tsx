import { createAdminSupabaseClient } from '@/lib/supabase'
import { LogsTable } from '@/components/logs/logs-table'
import type { PlayerEventWithSnapshot } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('player_events')
    .select(`*, inventory:player_inventory(*), items:player_items(*), equipped:player_equipped(*)`)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Player Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Join and leave events — click any row to expand snapshot data
        </p>
      </div>
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {error.message}
        </div>
      )}
      <LogsTable events={(data as PlayerEventWithSnapshot[]) ?? []} />
    </div>
  )
}
