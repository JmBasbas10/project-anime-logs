import { createAdminSupabaseClient } from '@/lib/supabase'
import { PurchasesTable, type ProductPurchase } from '@/components/purchases/purchases-table'

export const dynamic = 'force-dynamic'

export default async function PurchasesPage() {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('product_purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const purchases = (data as ProductPurchase[]) ?? []
  const totalRobux = purchases.reduce((s, p) => s + p.robux_spent, 0)

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Product Purchases</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>Robux purchases made in-game</div>
        </div>
        <div className="d-flex gap-2">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 80 }}>
            <div className="fw-bold">{purchases.length}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Purchases</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 100 }}>
            <div className="fw-bold font-monospace text-success" style={{ fontSize: 13 }}>R$ {totalRobux.toLocaleString()}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Total Robux</div>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger small">{error.message}</div>}
      <PurchasesTable purchases={purchases} />
    </div>
  )
}
