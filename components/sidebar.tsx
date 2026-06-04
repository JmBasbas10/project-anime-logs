'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/logs', label: 'Snapshots', icon: '📋' },
  { href: '/gifts', label: 'Gifts', icon: '🎁' },
  { href: '/servers', label: 'Servers', icon: '🖥️' },
  { href: '/players', label: 'Players', icon: '👤' },
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
      className="d-flex flex-column flex-shrink-0 p-3 border-end"
      style={{ width: '220px', minHeight: '100vh', backgroundColor: 'var(--bs-body-bg)' }}
    >
      <div className="mb-3 pb-3 border-bottom">
        <span className="fw-bold fs-5">🎮 Anime Logs</span>
        <div className="text-muted small">Roblox Dashboard</div>
      </div>

      <ul className="nav nav-pills flex-column mb-auto gap-1">
        {navItems.map(({ href, label, icon }) => (
          <li key={href} className="nav-item">
            <Link
              href={href}
              className={`nav-link d-flex align-items-center gap-2 ${
                pathname.startsWith(href) ? 'active' : 'text-secondary'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-3 border-top">
        <button
          className="btn btn-outline-secondary btn-sm w-100"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
