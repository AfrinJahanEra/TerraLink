import { Check, Minus, ShieldCheck, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROLE_ACCESS } from '../../constants/access'
import { getNavigationForRole } from '../../constants/navigation'
import { cn } from '../../utils/cn'

/** Plain statement of what a staff role can open and do. Read from the same table that enforces it. */
export function AccessPanel({ open, role, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open || !role?.staff) return null
  const access = ROLE_ACCESS[role.id]
  const pages = getNavigationForRole(role.id).flatMap((group) => group.items)

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="access-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close access panel" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><ShieldCheck size={20} /></span>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Your role</p><h2 id="access-title" className="mt-0.5 text-lg font-semibold text-slate-900">{role.label}</h2><p className="mt-0.5 text-xs text-slate-500">{access.headline}</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section aria-label="What you can do">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">You can</h3>
            <ul className="mt-3 space-y-2.5">
              {access.can.map((item) => <li key={item} className="flex items-start gap-2.5 text-[13px] leading-5 text-slate-700"><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Check size={11} strokeWidth={3} /></span>{item}</li>)}
            </ul>
          </section>

          <section aria-label="What you cannot do">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">You cannot</h3>
            <ul className="mt-3 space-y-2.5">
              {access.cannot.map((item) => <li key={item} className="flex items-start gap-2.5 text-[13px] leading-5 text-slate-600"><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500"><Minus size={11} strokeWidth={3} /></span>{item}</li>)}
            </ul>
          </section>

          <section aria-label="Pages you can open">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pages you can open</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {pages.map((page) => (
                <Link key={page.path} to={page.path} onClick={onClose} className={cn('inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-400 hover:text-brand-800')}>
                  <page.icon size={13} className="text-slate-500" />{page.label}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-5 text-slate-400">This prototype checks access in the app only. A real deployment would enforce the same rules on a server. To use a different role, sign out and sign in again.</p>
      </aside>
    </div>
  )
}
