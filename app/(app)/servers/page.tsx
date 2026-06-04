import { createAdminSupabaseClient } from '@/lib/supabase'
import { ServersList } from '@/components/servers/servers-list'
import type { Server } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ServersPage() {
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .order('last_ping', { ascending: false })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Active Servers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live server list sorted by most recent ping
        </p>
      </div>
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {error.message}
        </div>
      )}
      <ServersList servers={(data as Server[]) ?? []} />
    </div>
  )
}
