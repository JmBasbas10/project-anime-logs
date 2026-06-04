'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/events',    label: 'Events',    icon: '⚡' },
  { href: '/logs',      label: 'Snapshots', icon: '📋' },
  { href: '/gifts',     label: 'Gifts',     icon: '🎁' },
  { href: '/sales',     label: 'Sales',     icon: '💰' },
  { href: '/purchases', label: 'Purchases', icon: '🛒' },
  { href: '/revenue',   label: 'Revenue',   icon: '📈' },
  { href: '/servers',   label: 'Servers',   icon: '🖥️' },
  { href: '/players',   label: 'Players',   icon: '👤' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div
      className="offcanvas-md offcanvas-start d-flex flex-column flex-shrink-0"
      id="sidebar-offcanvas"
      tabIndex={-1}
      style={{
        width: 220,
        minHeight: '100vh',
        background: 'var(--bs-body-bg)',
        borderRight: '1px solid var(--bs-border-color)',
      }}
    >
      {/* Offcanvas header — close button visible on mobile only */}
      <div
        className="offcanvas-header d-md-none border-bottom px-4 py-3"
        style={{ minHeight: 0 }}
      >
        <span className="fw-bold">🎮 Anime Logs</span>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          data-bs-target="#sidebar-offcanvas"
        />
      </div>

      {/* Brand — visible on desktop only */}
      <div className="d-none d-md-block px-4 py-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 22 }}>🎮</span>
          <div>
            <div className="fw-bold" style={{ fontSize: 15, lineHeight: 1.2 }}>Anime Logs</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Roblox Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-grow-1 py-2 px-2 offcanvas-body">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              data-bs-dismiss="offcanvas"
              data-bs-target="#sidebar-offcanvas"
              className="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1 text-decoration-none"
              style={{
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--bs-primary-text-emphasis)' : 'var(--bs-secondary-color)',
                background: active ? 'var(--bs-primary-bg-subtle)' : 'transparent',
                borderLeft: active ? '3px solid var(--bs-primary)' : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-top">
        <button
          className="btn btn-sm w-100 text-secondary"
          style={{ textAlign: 'left', fontSize: 13 }}
          onClick={handleSignOut}
        >
          ← Sign out
        </button>
      </div>
    </div>
  )
}
