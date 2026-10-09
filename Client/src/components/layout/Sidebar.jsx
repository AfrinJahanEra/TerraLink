import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../constants/navigation'
import { cn } from '../../utils/cn'
import { Logo } from '../brand/Logo'

export function Sidebar({ collapsed, mobileOpen, onCollapse, onClose }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:translate-x-0',
          collapsed ? 'lg:w-[84px]' : 'lg:w-[260px]',
          mobileOpen ? 'w-[280px] translate-x-0 shadow-pop' : 'w-[280px] -translate-x-full',
        )}
      >
        <div className={cn('flex h-[73px] items-center border-b border-slate-100', collapsed ? 'lg:justify-center lg:px-0' : 'px-6')}>
          <Logo compact={collapsed} />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
          {NAV_ITEMS.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <p className={cn('mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400', collapsed && 'lg:text-center lg:text-[0px]')}>
                {collapsed ? '•' : group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ label, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={onClose}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) => cn(
                      'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      collapsed && 'lg:justify-center lg:px-0',
                      isActive
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} className={cn('shrink-0', isActive ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-600')} />
                        <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onCollapse}
            className="hidden h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 lg:flex"
          >
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse sidebar</span></>}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 lg:hidden">
            <LogOut size={15} /> Navigation closes after selection
          </div>
        </div>
      </aside>
    </>
  )
}
