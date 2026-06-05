'use client'

import { AutoRefresh } from '@/components/auto-refresh'
import { ThemeToggle } from '@/components/theme-toggle'

export function TopNav() {
  return (
    <nav
      className="navbar px-3 py-2 border-bottom sticky-top d-flex justify-content-between"
      style={{ background: 'var(--bs-body-bg)', zIndex: 1040 }}
    >
      <div className="d-flex align-items-center">
        {/* Hamburger — mobile only */}
        <button
          className="navbar-toggler border-0 p-1 d-md-none me-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebar-offcanvas"
          aria-controls="sidebar-offcanvas"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <span className="fw-bold d-md-none">🎮 Anime Logs</span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <ThemeToggle />
        <AutoRefresh />
      </div>
    </nav>
  )
}
