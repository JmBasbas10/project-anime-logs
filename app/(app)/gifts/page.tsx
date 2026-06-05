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
  const uniqueGivers = new Set(gifts.map(g => g.giver_id)).size

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Gifts</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>Character transfers between players</div>
        </div>
        <div className="d-flex gap-2">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{gifts.length}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Transfers</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{uniqueGivers}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Givers</div>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger small">{error.message}</div>}
      <GiftsTable gifts={gifts} />
    </div>
  )
}
