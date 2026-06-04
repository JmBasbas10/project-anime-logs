import { createAdminSupabaseClient } from '@/lib/supabase'
import { SalesTable, type CharacterSale } from '@/components/sales/sales-table'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('character_sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const sales = (data as CharacterSale[]) ?? []
  const totalCash = sales.reduce((s, r) => s + r.cash_received, 0)

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Character Sales</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>Characters sold by players</div>
        </div>
        <div className="d-flex gap-2">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{sales.length}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Sales</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 100 }}>
            <div className="fw-bold font-monospace" style={{ fontSize: 13 }}>{totalCash.toLocaleString()}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Total cash</div>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger small">{error.message}</div>}
      <SalesTable sales={sales} />
    </div>
  )
}
