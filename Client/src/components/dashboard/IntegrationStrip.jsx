import { CalendarDays, Mail, MessageCircleMore, PlugZap } from 'lucide-react'
import { Link } from 'react-router-dom'

const icons = { email: Mail, calendar: CalendarDays, whatsapp: MessageCircleMore }

export function IntegrationStrip({ integrations, canManage = false }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:mr-auto"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><PlugZap size={17} /></span><div><h2 className="text-sm font-semibold text-slate-900">Workflow automations</h2><p className="mt-0.5 text-xs text-slate-400">Keep your project team informed across channels.</p></div></div>
      <div className="flex flex-wrap items-center gap-2.5">
        {integrations.map((integration) => {
          const Icon = icons[integration.id]
          return <div key={integration.id} title={integration.detail} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"><Icon size={15} /><span>{integration.name}</span><span className={`size-1.5 rounded-full ${integration.state === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div>
        })}
        {canManage && <Link to="/integrations" className="rounded-lg px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">Manage</Link>}
      </div>
    </section>
  )
}
