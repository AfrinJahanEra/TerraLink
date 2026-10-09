import { Bell, Check, ChevronDown, CircleHelp, LogOut, Menu, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROLE_LIST } from '../../constants/roles'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useApp } from '../../hooks/useApp'
import { AboutPanel } from './AboutPanel'

const roleNotices = {
  manager: {
    title: 'Pond A requires review',
    detail: 'A sample change observation is ready for your review decision.',
  },
  coordinator: {
    title: 'Field check due today',
    detail: 'Your Pond A verification task is ready for a field update.',
  },
  operator: {
    title: 'Expense record needs an update',
    detail: 'A programme expense is waiting for supporting record details.',
  },
}

export function Topbar({ title, onOpenMenu }) {
  const { role, selectRole, signOut } = useApp()
  const navigate = useNavigate()
  const [roleOpen, setRoleOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const roleRef = useRef(null)
  const noticeRef = useRef(null)
  useClickOutside(roleRef, () => setRoleOpen(false), roleOpen)
  useClickOutside(noticeRef, () => setNoticeOpen(false), noticeOpen)

  const initials = role.user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')
  const notice = roleNotices[role.id]

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-[73px] items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-7">
      <button type="button" onClick={onOpenMenu} aria-label="Open navigation" className="mr-3 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
        <Menu size={21} />
      </button>

      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">TerraLink / Workspace</p>
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <button type="button" className="hidden h-10 w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition hover:border-slate-300 md:flex">
          <Search size={17} /> Search workspace
          <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</kbd>
        </button>

        <button type="button" onClick={() => setAboutOpen(true)} aria-label="About and help" title="About and help" className="grid size-10 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          <CircleHelp size={19} />
        </button>

        <div className="relative" ref={noticeRef}>
          <button type="button" onClick={() => setNoticeOpen((open) => !open)} aria-label="Notifications" className="relative grid size-10 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100">
            <Bell size={19} />
            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-amber-500" />
          </button>
          {noticeOpen && (
            <div className="absolute right-0 top-12 w-[min(340px,calc(100vw-2rem))] animate-fade-in rounded-xl border border-slate-200 bg-white p-4 shadow-pop">
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-900">Notifications</h2><span className="text-xs text-brand-700">1 new</span></div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-sm font-medium text-slate-800">{notice.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{notice.detail}</p>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={roleRef}>
          <button type="button" onClick={() => setRoleOpen((open) => !open)} className="flex h-11 items-center gap-2 rounded-lg px-1.5 transition hover:bg-slate-50 sm:pr-2">
            <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{initials}</span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-28 truncate text-xs font-semibold text-slate-800">{role.user.name}</span>
              <span className="block text-[10px] text-slate-500">{role.label}</span>
            </span>
            <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
          </button>

          {roleOpen && (
            <div className="absolute right-0 top-13 w-64 animate-fade-in rounded-xl border border-slate-200 bg-white p-2 shadow-pop">
              <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview as</p>
              {ROLE_LIST.map((item) => (
                <button key={item.id} type="button" onClick={() => { selectRole(item.id); setRoleOpen(false) }} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-slate-50">
                  <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><item.icon size={16} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-800">{item.label}</span><span className="block truncate text-[11px] text-slate-400">{item.user.name}</span></span>
                  {item.id === role.id && <Check size={16} className="text-slate-700" />}
                </button>
              ))}
              <div className="my-2 border-t border-slate-100" />
              <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"><LogOut size={16} className="text-slate-600" /> Sign out</button>
            </div>
          )}
        </div>
      </div>
      <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </header>
  )
}
