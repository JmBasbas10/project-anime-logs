'use client'

interface Props {
  page: number
  total: number
  perPage: number
  onPageChange: (p: number) => void
  onPerPageChange: (n: number) => void
}

export function Pagination({ page, total, perPage, onPageChange, onPerPageChange }: Props) {
  const pages = Math.ceil(total / perPage)
  const from = Math.min(perPage * (page - 1) + 1, total)
  const to = Math.min(perPage * page, total)

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
      <div className="text-muted" style={{ fontSize: 13 }}>
        {total === 0 ? '0 results' : `${from}–${to} of ${total}`}
      </div>
      <div className="d-flex align-items-center gap-2">
        <select
          className="form-select form-select-sm"
          style={{ width: 130, fontSize: 13 }}
          value={perPage}
          onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1) }}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-secondary"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            ‹
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
