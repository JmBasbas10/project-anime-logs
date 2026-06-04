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
    .limit(500)

  const gifts = (data as GiftLog[]) ?? []
  const total = gifts.reduce((s, g) => s + g.gift_value, 0)

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Gifts</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>All gift transactions</div>
        </div>
        <div className="d-flex gap-2">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{gifts.length}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Gifts</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 100 }}>
            <div className="fw-bold font-monospace" style={{ fontSize: 13 }}>{total.toLocaleString()}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Total value</div>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger small">{error.message}</div>}
      <GiftsTable gifts={gifts} />
    </div>
  )
}
