import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { getPageTitle } from '../../constants/navigation'
import { cn } from '../../utils/cn'
import { PrototypeBanner } from './PrototypeBanner'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((value) => !value)}
        onClose={() => setMobileOpen(false)}
      />
      <div className={cn('min-h-screen transition-[margin] duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-[232px]')}>
        <Topbar title={getPageTitle(pathname)} onOpenMenu={() => setMobileOpen(true)} />
        <PrototypeBanner />
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
