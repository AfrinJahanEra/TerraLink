import { FileText, LogOut } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { cn } from '../../utils/cn'
import { Logo } from '../brand/Logo'

const navClass = ({ isActive }) => cn(
  'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold transition sm:px-3',
  isActive ? 'bg-white/14 text-white' : 'text-brand-100/80 hover:bg-white/8 hover:text-white',
)

const initialsOf = (name) => name.split(' ').map((part) => part[0]).slice(0, 2).join('')

/** Shell for the community pages. Anyone can look at the map; sending a report needs a signed-in User. */
export function PublicLayout() {
  const { role, signOut } = useApp()
  const navigate = useNavigate()
  const isUser = role?.id === 'user'

  function handleSignOut() {
    signOut()
    navigate('/explore')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-[900] border-b border-brand-800 bg-brand-700 text-white shadow-[0_1px_0_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-3 px-3 sm:px-5">
          <Link to={role ? '/explore' : '/'} aria-label={role ? 'TerraLink, back to the map' : 'TerraLink home'} className="flex shrink-0 items-center gap-2.5">
            <Logo inverse compact />
            <span className="hidden text-[15px] font-bold tracking-tight text-white sm:block">TerraLink</span>
          </Link>

          {isUser && (
            <nav aria-label="Account pages" className="ml-1 flex items-center gap-0.5 sm:ml-4">
              <NavLink to="/my-reports" className={navClass}><FileText size={15} />My reports</NavLink>
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            {role ? (
              <>
                {role.staff && <Link to="/dashboard" className="inline-flex h-9 items-center rounded-lg border border-white/20 px-3 text-[13px] font-semibold text-white transition hover:bg-white/10">Workspace</Link>}
                <span className="hidden items-center gap-2.5 pl-1 md:flex">
                  <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-900">{initialsOf(role.user.name)}</span>
                  <span className="text-left leading-tight"><span className="block text-xs font-semibold text-white">{role.user.name}</span><span className="block text-[10px] text-brand-100/85">{role.label}</span></span>
                </span>
                <button type="button" onClick={handleSignOut} aria-label="Sign out" title="Sign out" className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 px-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10 sm:px-3"><LogOut size={15} /><span className="hidden sm:inline">Sign out</span></button>
              </>
            ) : (
              <>
                <Link to="/login" className="inline-flex h-9 items-center rounded-lg border border-white/20 px-3 text-[13px] font-semibold text-white transition hover:bg-white/10">Log in</Link>
                <Link to="/register?role=user" className="hidden h-9 items-center rounded-lg bg-white px-3 text-[13px] font-semibold text-brand-950 transition hover:bg-brand-50 sm:inline-flex">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1480px] flex-1 px-3 py-4 sm:px-5 sm:py-5">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <p className="mx-auto max-w-[1480px] px-3 py-3 text-[11px] leading-5 text-slate-500 sm:px-5">
          Prototype. Reports are saved in this browser only and are evidence for a reviewer to check, not a finding about a water body. Outlines © OpenStreetMap contributors. Satellite tiles © Esri and its data partners.
        </p>
      </footer>
    </div>
  )
}
