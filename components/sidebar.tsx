'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/events', label: 'Events', icon: '⚡', desc: 'Join / leave' },
  { href: '/logs', label: 'Snapshots', icon: '📋', desc: 'Batch data' },
  { href: '/gifts', label: 'Gifts', icon: '🎁', desc: 'Transactions' },
  { href: '/servers', label: 'Servers', icon: '🖥️', desc: 'Active servers' },
  { href: '/players', label: 'Players', icon: '👤', desc: 'Lookup' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div
      className="d-flex flex-column flex-shrink-0 border-end"
      style={{ width: 210, minHeight: '100vh', backgroundColor: 'var(--bs-body-bg)' }}
    >
      {/* Brand */}
      <div className="px-3 py-3 border-bottom">
        <div className="fw-bold fs-6">🎮 Anime Logs</div>
        <div className="text-muted" style={{ fontSize: 11 }}>Roblox Dashboard</div>
      </div>

      {/* Nav */}
      <nav className="flex-grow-1 p-2">
        {navItems.map(({ href, label, icon, desc }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded mb-1 text-decoration-none ${
                active
                  ? 'bg-primary text-white'
                  : 'text-secondary'
              }`}
              style={{ fontSize: 14 }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div>
                <div className="fw-medium lh-1">{label}</div>
                <div className={`lh-1 mt-1 ${active ? 'text-white opacity-75' : 'text-muted'}`} style={{ fontSize: 11 }}>
                  {desc}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-top">
        <button
          className="btn btn-outline-secondary btn-sm w-100"
          onClick={handleSignOut}
          style={{ fontSize: 13 }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
