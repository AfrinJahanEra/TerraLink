import { ArrowRight, Camera, FileText, MapPin, Ruler, ShieldQuestion, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SITE_GROUP, SITE_STATUS, siteGroup } from '../../constants/status'
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

/** Summary of a selected water body. `publicView` links to the public pond page and the report form instead of the staff workspace. */
export function SiteDetailsPanel({ site, onClose, compact = false, publicView = false, showReportsLink = true }) {
  if (!site) return null

  const status = SITE_STATUS[site.status]

  return (
    <article className={compact ? 'border-t border-slate-200 bg-white' : 'overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-pop backdrop-blur'}>
      <div className="relative h-32 overflow-hidden bg-slate-100">
        <img src={site.image} alt={`Satellite view of ${site.name}`} className="size-full object-cover" />
        <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">Esri World Imagery</span>
        <button type="button" onClick={onClose} aria-label="Close site details" className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white/95 text-slate-600 shadow-card transition hover:text-slate-900">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-base font-semibold text-slate-900">{site.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} className="text-slate-500" />{site.location}</p></div>
          <Badge tone={publicView ? SITE_GROUP[siteGroup(site.status)].tone : status.tone} className="shrink-0 text-[10px]">{status.label}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-100 py-4">
          <DetailRow icon={Ruler} label="Mapped area" value={site.area} />
          <DetailRow icon={FileText} label="Open reports" value={site.openReports} />
          <DetailRow icon={ShieldQuestion} label="Boundary" value="Unverified, from OpenStreetMap" />
          <DetailRow icon={Ruler} label="Water-area change" value="Not yet measured" />
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">{site.reviewNote}</p>

        <Button as={Link} to={publicView ? `/explore/${site.id}` : `/sites/${site.id}`} className="mt-4 w-full">
          {publicView ? 'Open pond page' : 'Open site details'} <ArrowRight size={15} />
        </Button>
        {(publicView || showReportsLink) && (
          <Button as={Link} to={publicView ? `/report?site=${site.id}` : `/community?site=${site.id}`} variant="secondary" className="mt-2 w-full">
            <Camera size={15} className="text-slate-600" />{publicView ? 'Report a problem here' : 'View community reports'}
          </Button>
        )}
      </div>
    </article>
  )
}
