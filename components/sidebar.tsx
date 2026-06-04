'use client'

import { useEffect } from 'react'
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

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {navItems.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
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
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  // Close the mobile offcanvas after navigation completes, using Bootstrap's
  // own API so the backdrop and body styles are cleaned up (avoids stuck overlay).
  useEffect(() => {
    const el = document.getElementById('sidebar-offcanvas')
    if (!el) return
    const bs = (window as unknown as { bootstrap?: { Offcanvas?: { getInstance: (e: Element) => { hide: () => void } | null } } }).bootstrap
    bs?.Offcanvas?.getInstance(el)?.hide()
    // Safety net: remove any orphaned backdrop / body locks
    document.querySelectorAll('.offcanvas-backdrop').forEach(b => b.remove())
    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('padding-right')
  }, [pathname])

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <div
        className="d-none d-md-flex flex-column flex-shrink-0"
        style={{
          width: 220,
          minHeight: '100vh',
          background: 'var(--bs-body-bg)',
          borderRight: '1px solid var(--bs-border-color)',
        }}
      >
        <div className="px-4 py-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 22 }}>🎮</span>
            <div>
              <div className="fw-bold" style={{ fontSize: 15, lineHeight: 1.2 }}>Anime Logs</div>
              <div className="text-muted" style={{ fontSize: 11 }}>Roblox Dashboard</div>
            </div>
          </div>
        </div>

        <nav className="flex-grow-1 py-2 px-2">
          <NavLinks pathname={pathname} />
        </nav>

        <div className="px-3 py-3 border-top">
          <button className="btn btn-sm w-100 text-secondary" style={{ textAlign: 'left', fontSize: 13 }} onClick={handleSignOut}>
            ← Sign out
          </button>
        </div>
      </div>

      {/* Mobile offcanvas — opened by the hamburger in TopNav */}
      <div
        className="offcanvas offcanvas-start d-md-none"
        id="sidebar-offcanvas"
        tabIndex={-1}
        style={{ width: 240 }}
      >
        <div className="offcanvas-header border-bottom">
          <span className="fw-bold">🎮 Anime Logs</span>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body d-flex flex-column p-2">
          <nav className="flex-grow-1">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="px-1 py-2 border-top mt-2">
            <button className="btn btn-sm w-100 text-secondary" style={{ textAlign: 'left', fontSize: 13 }} onClick={handleSignOut}>
              ← Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
