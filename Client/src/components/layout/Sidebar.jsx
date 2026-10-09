import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { getNavigationForRole, isNavItemActive } from '../../constants/navigation'
import { useApp } from '../../hooks/useApp'
import { cn } from '../../utils/cn'
import { Logo } from '../brand/Logo'

export function Sidebar({ collapsed, mobileOpen, onCollapse, onClose }) {
  const { role } = useApp()
  const { pathname } = useLocation()
  const navigation = getNavigationForRole(role.id)

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
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-brand-900 bg-brand-950 text-white transition-all duration-200 lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[232px]',
          mobileOpen ? 'w-[248px] translate-x-0 shadow-pop' : 'w-[248px] -translate-x-full',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center border-b border-white/10', collapsed ? 'lg:justify-center lg:px-0' : 'px-4')}>
          <Logo compact={collapsed} inverse size="lg" />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-brand-100 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 pt-10 [@media(max-height:760px)]:pt-6" aria-label="Primary navigation">
          {navigation.map((group) => (
            <div key={group.label} className="sidebar-group">
              <p className={cn('mb-1.5 px-2.5 text-[11px] font-bold uppercase leading-[14px] tracking-[0.12em] text-brand-300/80', collapsed && 'lg:text-center lg:text-[0px]')}>
                {collapsed ? <span className="mx-auto block h-px w-5 bg-white/15" /> : group.label}
              </p>
              <div className="sidebar-items">
                {group.items.map((item) => {
                  const { label, path, icon: Icon } = item
                  const isActive = isNavItemActive(item, pathname)
                  return (
                    <NavLink
                      key={path}
                      to={path}
                      end
                      onClick={onClose}
                      title={collapsed ? label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'sidebar-link group flex items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium transition-colors',
                        collapsed && 'lg:h-8 lg:justify-center lg:px-0',
                        isActive
                          ? 'bg-white/12 text-white'
                          : 'text-brand-100/80 hover:bg-white/[0.06] hover:text-white',
                      )}
                    >
                      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={cn('shrink-0', isActive ? 'text-white' : 'text-brand-200/70 group-hover:text-white')} />
                      <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-2.5 py-1.5">
          <button
            type="button"
            onClick={onCollapse}
            className="hidden h-8 w-full items-center justify-center gap-1.5 rounded-md text-[12px] font-medium text-brand-100/70 transition hover:bg-white/[0.06] hover:text-white lg:flex"
          >
            {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse sidebar</span></>}
          </button>
          <div className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-brand-100/60 lg:hidden">
            <LogOut size={13} /> Navigation closes after selection
          </div>
        </div>
      </aside>
    </>
  )
}
