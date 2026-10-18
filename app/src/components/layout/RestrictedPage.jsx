import { ArrowLeft, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PERMISSIONS } from '../../constants/access'
import { getNavigationForRole, pageForPath } from '../../constants/navigation'
import { ROLES } from '../../constants/roles'
import { Button } from '../ui/Button'
import { AccessPanel } from './AccessPanel'

/** Shown instead of a page the current role does not have. It says why and where to go, rather than redirecting silently. */
export function RestrictedPage({ role, pathname }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const page = pageForPath(pathname)
  const owners = (PERMISSIONS[page?.permission] ?? []).map((id) => ROLES[id].label)
  const yours = getNavigationForRole(role.id).flatMap((group) => group.items)

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-600"><Lock size={21} /></span>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-950">{page ? `The ${page.label} page is not part of your role` : 'This page is not part of your role'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        You are signed in as <strong className="font-semibold text-slate-800">{role.label}</strong>.
        {owners.length > 0 && <> This page is for the {owners.join(' and ').toLowerCase()}.</>} Your workspace only shows what your role needs.
      </p>

      <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Go to</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {yours.map((item) => <Link key={item.path} to={item.path} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-400 hover:text-brand-800"><item.icon size={13} className="text-slate-500" />{item.label}</Link>)}
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row">
        <Button as={Link} to="/dashboard"><ArrowLeft size={15} />Back to my dashboard</Button>
        <Button type="button" variant="secondary" onClick={() => setPanelOpen(true)}>See what my role can do</Button>
      </div>
      <AccessPanel open={panelOpen} role={role} onClose={() => setPanelOpen(false)} />
    </div>
  )
}
