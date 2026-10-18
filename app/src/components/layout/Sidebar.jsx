import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
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
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[linear-gradient(180deg,#0d2e31_0%,#0b282b_45%,#082022_100%)] text-white transition-all duration-200 lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[232px]',
          mobileOpen ? 'w-[248px] translate-x-0 shadow-pop' : 'w-[248px] -translate-x-full',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center border-b border-white/[0.06]', collapsed ? 'lg:justify-center lg:px-0' : 'px-4')}>
          <Logo compact={collapsed} inverse />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="ml-auto grid size-8 place-items-center rounded-md text-white/60 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-5" aria-label="Primary navigation">
          {navigation.map((group) => (
            <div key={group.label} className="sidebar-group">
              {collapsed
                ? <span aria-hidden="true" className="mx-auto mb-2 hidden h-px w-6 bg-white/10 lg:block" />
                : null}
              <p className={cn('mb-1.5 px-3 text-[10px] font-semibold uppercase leading-[13px] tracking-[0.14em] text-white/35', collapsed && 'lg:sr-only')}>
                {group.label}
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
                        'sidebar-link group relative flex items-center gap-3 rounded-md px-3 text-[12.5px] transition-colors duration-150',
                        collapsed && 'lg:justify-center lg:px-0',
                        isActive
                          ? 'bg-white/[0.08] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                          : 'font-medium text-white/65 hover:bg-white/[0.04] hover:text-white',
                      )}
                    >
                      {isActive && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-brand-300" />}
                      <Icon size={15} strokeWidth={isActive ? 2.1 : 1.8} className={cn('shrink-0 transition-colors', isActive ? 'text-brand-300' : 'text-white/45 group-hover:text-white/80')} />
                      <span className={cn('min-w-0 flex-1 truncate', collapsed && 'lg:hidden')}>{label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden shrink-0 border-t border-white/[0.06] p-3 lg:block">
          <button
            type="button"
            onClick={onCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : undefined}
            className={cn('flex h-8 w-full items-center gap-3 rounded-md px-3 text-[12px] font-medium text-white/50 transition hover:bg-white/[0.04] hover:text-white', collapsed && 'justify-center px-0')}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <><PanelLeftClose size={15} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}
