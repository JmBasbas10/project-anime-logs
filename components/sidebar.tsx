'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutList, Gift, Server, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/logs', label: 'Logs', icon: LayoutList },
  { href: '/gifts', label: 'Gifts', icon: Gift },
  { href: '/servers', label: 'Servers', icon: Server },
  { href: '/players', label: 'Players', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-56 border-r bg-sidebar h-screen sticky top-0 flex flex-col shrink-0">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg tracking-tight">Anime Logs</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Roblox Dashboard</p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
