import { ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SITE_STATUS } from '../../constants/status'

export function SiteSnapshot({ sites, title = 'Water bodies', registerLink = '/sites' }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-400">Status, mapped area and open reports</p></div>
        {registerLink && <Link to={registerLink} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">Open register <ArrowRight size={14} className="text-slate-500" /></Link>}
      </div>

      <div className="divide-y divide-slate-100">
        {sites.map((site) => {
          const status = SITE_STATUS[site.status]
          return (
            <Link key={site.id} to={`/sites/${site.id}`} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/80 sm:px-5">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img src={site.image} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-slate-800">{site.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><MapPin size={11} /> {site.location} · {site.area}{site.openReports ? ` · ${site.openReports} open report${site.openReports > 1 ? 's' : ''}` : ''}</p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 sm:inline-flex"><span className="size-1.5 rounded-sm" style={{ backgroundColor: status.color }} />{status.label}</span>
              <ArrowRight size={15} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
