import { Sidebar } from '@/components/sidebar'
import { TopNav } from '@/components/top-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Mobile top bar — hidden on md+ */}
      <TopNav />

      <div className="d-flex">
        {/* Sidebar — offcanvas on mobile, inline on md+ */}
        <Sidebar />

        <main className="flex-grow-1 overflow-auto" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
