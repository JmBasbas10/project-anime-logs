'use client'

export function TopNav() {
  return (
    <nav
      className="d-md-none navbar px-3 py-2 border-bottom sticky-top"
      style={{ background: 'var(--bs-body-bg)', zIndex: 1040 }}
    >
      <button
        className="navbar-toggler border-0 p-1"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebar-offcanvas"
        aria-controls="sidebar-offcanvas"
      >
        <span className="navbar-toggler-icon" />
      </button>
      <span className="fw-bold ms-2">🎮 Anime Logs</span>
    </nav>
  )
}
