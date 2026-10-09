import { ArrowRight, CalendarDays, CloudSun, MapPin, Ruler, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SITE_STATUS } from '../../constants/status'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-slate-500" />
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-0.5 text-xs font-medium text-slate-700">{value}</p></div>
    </div>
  )
}

export function SiteDetailsPanel({ site, onClose, compact = false }) {
  if (!site) return null

  const status = SITE_STATUS[site.status]
  const formattedChange = site.change === null ? 'Not available' : `${site.change > 0 ? '+' : ''}${site.change}%`

  return (
    <article className={compact ? 'border-t border-slate-200 bg-white' : 'overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-pop backdrop-blur'}>
      <div className="relative h-32 overflow-hidden bg-slate-100">
        <img src={site.image} alt={`Illustrative wetland view of ${site.name}`} className="size-full object-cover" />
        <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">Sample visual</span>
        <button type="button" onClick={onClose} aria-label="Close site details" className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white/95 text-slate-600 shadow-card transition hover:text-slate-900">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-base font-semibold text-slate-900">{site.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} className="text-slate-500" />{site.location}</p></div>
          <Badge tone={status.tone} className="shrink-0 text-[10px]">{status.label}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-100 py-4">
          <DetailRow icon={Ruler} label="Visible area" value={site.area} />
          <DetailRow icon={CalendarDays} label="Last observed" value={site.lastObserved} />
          <DetailRow icon={CloudSun} label="Clear coverage" value={site.clearCoverage} />
          <DetailRow icon={CalendarDays} label="Comparison" value={site.comparison} />
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <span className="text-xs text-slate-500">Estimated change</span>
          <span className="text-base font-bold text-slate-900">{formattedChange}</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{site.reviewNote}</p>

        <Button as={Link} to={`/sites/${site.id}`} className="mt-4 w-full">
          Open site details <ArrowRight size={15} />
        </Button>
      </div>
    </article>
  )
}
