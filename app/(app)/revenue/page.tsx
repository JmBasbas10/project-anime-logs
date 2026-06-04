import { createAdminSupabaseClient } from '@/lib/supabase'
import { RevenueDashboard } from '@/components/revenue/revenue-dashboard'
import type { ProductPurchase } from '@/components/purchases/purchases-table'

export const dynamic = 'force-dynamic'

const PHP_PER_ROBUX = (38 * 62) / 2 / 10_000

export default async function RevenuePage() {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('product_purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000)

  const purchases = (data as ProductPurchase[]) ?? []
  const totalRobux = purchases.reduce((s, p) => s + p.robux_spent, 0)
  const totalPHP   = totalRobux * PHP_PER_ROBUX

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthRobux = purchases
    .filter(p => new Date(p.created_at) >= monthStart)
    .reduce((s, p) => s + p.robux_spent, 0)

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Revenue</h4>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Robux earnings · ₱{(PHP_PER_ROBUX * 10000).toFixed(2)} per 10,000 Robux · our share
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="card px-3 py-2 text-center" style={{ minWidth: 90 }}>
            <div className="fw-bold font-monospace">R$ {totalRobux.toLocaleString()}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>All-time Robux</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 100, borderColor: 'var(--bs-success)' }}>
            <div className="fw-bold font-monospace text-success">
              ₱{totalPHP.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>All-time (₱)</div>
          </div>
          <div className="card px-3 py-2 text-center" style={{ minWidth: 100 }}>
            <div className="fw-bold font-monospace text-success">
              ₱{(monthRobux * PHP_PER_ROBUX).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>This month (₱)</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger small">{error.message}</div>}

      <RevenueDashboard purchases={purchases} />
    </div>
  )
}
