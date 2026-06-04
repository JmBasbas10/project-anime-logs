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
    .limit(200)

  const gifts = (data as GiftLog[]) ?? []
  const totalValue = gifts.reduce((sum, g) => sum + g.gift_value, 0)

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Gift Logs</h2>
          <p className="text-muted small mb-0">All gift transactions</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="card text-center px-3 py-2">
            <div className="fw-bold fs-5">{gifts.length}</div>
            <div className="text-muted small">Gifts</div>
          </div>
          <div className="card text-center px-3 py-2">
            <div className="fw-bold fs-5">{totalValue.toLocaleString()}</div>
            <div className="text-muted small">Total value</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error.message}</div>}

      <GiftsTable gifts={gifts} />
    </div>
  )
}
