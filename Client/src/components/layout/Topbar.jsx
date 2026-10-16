import { ChevronDown, CircleHelp, LogOut, Menu, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useClickOutside } from '../../hooks/useClickOutside'
import { AboutPanel } from './AboutPanel'
import { AccessPanel } from './AccessPanel'

export function Topbar({ title, onOpenMenu }) {
  const { role, signOut } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const menuRef = useRef(null)
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen)

  const initials = role.user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <button type="button" onClick={onOpenMenu} aria-label="Open navigation" className="mr-3 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
        <Menu size={21} />
      </button>

      <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={() => setAboutOpen(true)} aria-label="About this prototype" title="About this prototype" className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          <CircleHelp size={19} />
        </button>

        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className="flex h-10 items-center gap-2 rounded-lg px-1.5 transition hover:bg-slate-50 sm:pr-2">
            <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{initials}</span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-28 truncate text-xs font-semibold text-slate-800">{role.user.name}</span>
              <span className="block text-[10px] text-slate-500">{role.label}</span>
            </span>
            <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-64 animate-fade-in rounded-xl border border-slate-200 bg-white p-2 shadow-pop">
              <div className="px-3 pb-2 pt-2">
                <p className="truncate text-sm font-semibold text-slate-900">{role.user.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{role.user.email}</p>
                <p className="mt-2 text-[11px] leading-4 text-slate-400">Signed in as {role.label}. To use another role, sign out and sign in again.</p>
              </div>
              <button type="button" onClick={() => { setMenuOpen(false); setAccessOpen(true) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ShieldCheck size={16} className="text-slate-500" />My role and access</button>
              <div className="my-2 border-t border-slate-100" />
              <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><LogOut size={16} className="text-slate-500" />Sign out</button>
            </div>
          )}
        </div>
      </div>
      <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <AccessPanel open={accessOpen} role={role} onClose={() => setAccessOpen(false)} />
    </header>
  )
}
