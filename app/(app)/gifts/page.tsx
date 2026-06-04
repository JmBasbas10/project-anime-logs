import { createAdminSupabaseClient } from '@/lib/supabase'
import { GiftsTable } from '@/components/gifts/gifts-table'
import type { GiftLog } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function GiftsPage() {
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('gift_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gift Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">All gift transactions</p>
      </div>
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {error.message}
        </div>
      )}
      <GiftsTable gifts={(data as GiftLog[]) ?? []} />
    </div>
  )
}
