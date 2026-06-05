'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const INTERVAL_MS = 60_000

export function AutoRefresh() {
  const router = useRouter()
  const [enabled, setEnabled] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (timer.current) clearInterval(timer.current)
      return
    }
    timer.current = setInterval(() => {
      // Avoid database reads while the dashboard is not visible or a modal is open.
      if (document.hidden || document.querySelector('.modal.show')) return
      setRefreshing(true)
      router.refresh()
      // brief visual pulse; server re-render resolves quickly for small queries
      setTimeout(() => setRefreshing(false), 600)
    }, INTERVAL_MS)

    return () => { if (timer.current) clearInterval(timer.current) }
  }, [enabled, router])

  return (
    <button
      className={`btn btn-sm ${enabled ? 'btn-outline-success' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
      style={{ fontSize: 12 }}
      onClick={() => setEnabled(v => !v)}
      title={enabled ? 'Auto-refresh every 60s (on)' : 'Auto-refresh (off)'}
    >
      <span
        className="rounded-circle"
        style={{
          width: 8, height: 8, display: 'inline-block',
          background: enabled ? 'var(--bs-success)' : 'var(--bs-secondary)',
          opacity: refreshing ? 0.3 : 1,
          transition: 'opacity .3s',
        }}
      />
      {enabled ? 'Live' : 'Paused'}
    </button>
  )
}
