'use client'

import { useState, useMemo } from 'react'
import type { ProductPurchase } from '@/components/purchases/purchases-table'
import { Pagination } from '@/components/ui/pagination'

// ₱ = Robux × 38 × 62 / 2 / 10,000
const PHP_PER_ROBUX = (38 * 62) / 2 / 10_000

function toPHP(robux: number) {
  return robux * PHP_PER_ROBUX
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString()
}

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

function getPeriodStart(period: Period): Date | null {
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'week')  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'year')  return new Date(now.getFullYear(), 0, 1)
  return null
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: "Today" },
  { key: 'week',  label: "This Week" },
  { key: 'month', label: "This Month" },
  { key: 'year',  label: "This Year" },
  { key: 'all',   label: "All Time" },
]

interface ProductBreakdown {
  product_name: string
  count: number
  robux: number
  php: number
}

interface Props {
  purchases: ProductPurchase[]
}

export function RevenueDashboard({ purchases }: Props) {
  const [period, setPeriod]     = useState<Period>('month')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)

  const filtered = useMemo(() => {
    const start = getPeriodStart(period)
    return purchases.filter(p => {
      const matchDate = !start || new Date(p.created_at) >= start
      const matchSearch = !search.trim() ||
        p.player_name.toLowerCase().includes(search.toLowerCase()) ||
        p.product_name.toLowerCase().includes(search.toLowerCase()) ||
        String(p.player_id).includes(search)
      return matchDate && matchSearch
    })
  }, [purchases, period, search])

  const totalRobux = filtered.reduce((s, p) => s + p.robux_spent, 0)
  const totalPHP   = toPHP(totalRobux)
  const avgPHP     = filtered.length ? totalPHP / filtered.length : 0

  // Breakdown by product
  const breakdown = useMemo<ProductBreakdown[]>(() => {
    const map = new Map<string, ProductBreakdown>()
    for (const p of filtered) {
      const existing = map.get(p.product_name) ?? { product_name: p.product_name, count: 0, robux: 0, php: 0 }
      existing.count++
      existing.robux += p.robux_spent
      existing.php    = toPHP(existing.robux)
      map.set(p.product_name, existing)
    }
    return [...map.values()].sort((a, b) => b.robux - a.robux)
  }, [filtered])

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div>
      {/* Period tabs */}
      <ul className="nav nav-tabs mb-4" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
        {PERIODS.map(({ key, label }) => (
          <li key={key} className="nav-item">
            <button
              className={`nav-link px-3 py-2 ${period === key ? 'active' : ''}`}
              onClick={() => { setPeriod(key); setPage(1) }}
              style={{ fontSize: 14 }}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card p-3">
            <div className="text-muted small mb-1">Purchases</div>
            <div className="fw-bold fs-4">{filtered.length}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3">
            <div className="text-muted small mb-1">Total Robux</div>
            <div className="fw-bold fs-4 font-monospace">R$ {totalRobux.toLocaleString()}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3" style={{ borderColor: 'var(--bs-success)' }}>
            <div className="text-muted small mb-1">Our Share (₱)</div>
            <div className="fw-bold fs-4 text-success font-monospace">₱{fmt(totalPHP)}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>@ ₱{fmt(PHP_PER_ROBUX * 10000, 2)} / 10k Robux</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3">
            <div className="text-muted small mb-1">Avg per Transaction</div>
            <div className="fw-bold fs-4 font-monospace">₱{fmt(avgPHP)}</div>
          </div>
        </div>
      </div>

      {/* Product breakdown */}
      {breakdown.length > 0 && (
        <div className="mb-4">
          <div className="fw-medium mb-2" style={{ fontSize: 14 }}>Breakdown by Product</div>
          <div className="table-responsive rounded border">
            <table className="table table-sm table-hover mb-0" style={{ fontSize: 13 }}>
              <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
                <tr>
                  <th>Product</th>
                  <th className="text-end">Purchases</th>
                  <th className="text-end">Robux</th>
                  <th className="text-end">Our Share (₱)</th>
                  <th style={{ width: 120 }}>% of total</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map(b => (
                  <tr key={b.product_name}>
                    <td><span className="badge bg-success-subtle text-success-emphasis">{b.product_name}</span></td>
                    <td className="text-end font-monospace">{b.count}</td>
                    <td className="text-end font-monospace">R$ {b.robux.toLocaleString()}</td>
                    <td className="text-end font-monospace text-success">₱{fmt(b.php)}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${totalRobux ? (b.robux / totalRobux) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-muted" style={{ fontSize: 11, minWidth: 32 }}>
                          {totalRobux ? ((b.robux / totalRobux) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
           style={{ borderBottom: '1px solid var(--bs-border-color)', paddingBottom: 12 }}>
        <span className="fw-medium" style={{ fontSize: 14 }}>
          Transactions <span className="badge bg-secondary ms-1">{filtered.length}</span>
        </span>
        <div className="input-group input-group-sm" style={{ width: 260 }}>
          <span className="input-group-text bg-transparent">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search player or product…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="table-responsive rounded border">
        <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
            <tr>
              <th style={{ width: 40 }} className="text-muted">#</th>
              <th>Player</th>
              <th>Product</th>
              <th className="text-end">Robux</th>
              <th className="text-end text-success">Our Share (₱)</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-5">No transactions in this period</td></tr>
            )}
            {paginated.map((p, i) => (
              <tr key={p.id}>
                <td className="text-muted">{(page - 1) * perPage + i + 1}</td>
                <td>
                  <div className="fw-medium">{p.player_name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>#{p.player_id}</div>
                </td>
                <td><span className="badge bg-success-subtle text-success-emphasis">{p.product_name}</span></td>
                <td className="text-end font-monospace">R$ {p.robux_spent.toLocaleString()}</td>
                <td className="text-end font-monospace text-success fw-medium">₱{fmt(toPHP(p.robux_spent))}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{fmtDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={filtered.length} perPage={perPage}
        onPageChange={setPage} onPerPageChange={setPerPage} />
    </div>
  )
}
