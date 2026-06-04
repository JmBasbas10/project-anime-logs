import { createAdminSupabaseClient } from '@/lib/supabase'
import { SalesTable, type CharacterSale } from '@/components/sales/sales-table'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('character_sales')
    .select('*, characters:sale_characters(*)')
    .order('created_at', { ascending: false })
    .limit(500)

  const sales = (data as CharacterSale[]) ?? []
  const totalCash    = sales.reduce((s, r) => s + (r.total_cash_received ?? 0), 0)
  const totalSold    = sales.reduce((s, r) => s + (r.total_sold ?? 0), 0)
  const sellAllCount = sales.filter(s => s.sale_type === 'SellAll').length
  const sellOneCount = sales.filter(s => s.sale_type === 'SellOne').length

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Character Sales</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Click any row to expand characters sold in that event
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{sales.length}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Events</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{totalSold}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Chars sold</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold text-warning">{sellAllCount}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>SellAll</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold text-info">{sellOneCount}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>SellOne</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 100 }}>
            <div className="fw-bold font-monospace" style={{ fontSize: 13 }}>
              {totalCash.toLocaleString()}
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>Total cash</div>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger small">{error.message}</div>}
      <SalesTable sales={sales} />
    </div>
  )
}
