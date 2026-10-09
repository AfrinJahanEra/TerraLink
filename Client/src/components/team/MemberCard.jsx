import { BriefcaseBusiness, Mail, MessageCircle, Pencil, UserRoundCheck } from 'lucide-react'
import { Badge } from '../ui/Badge'

const availability = {
  available: { label: 'Available', tone: 'emerald' },
  limited: { label: 'Limited availability', tone: 'amber' },
  leave: { label: 'On leave', tone: 'slate' },
}

export function MemberCard({ member, assignedCount, onEdit, canEdit }) {
  const workload = Math.min(Math.round((assignedCount / Math.max(member.capacity, 1)) * 100), 100)
  const state = availability[member.availability] ?? availability.available

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">{member.initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div><h2 className="truncate text-sm font-semibold text-slate-900">{member.name}</h2><p className="mt-0.5 text-xs text-slate-500">{member.role}</p></div>
            {canEdit && <button type="button" onClick={() => onEdit(member)} aria-label={`Edit ${member.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><Pencil size={15} /></button>}
          </div>
          <Badge tone={state.tone} className="mt-2 text-[10px]">{state.label}</Badge>
        </div>
      </div>

      <dl className="mt-4 space-y-2 border-y border-slate-100 py-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500"><Mail size={14} className="text-slate-500" /><a href={`mailto:${member.email}`} className="truncate hover:text-slate-800">{member.email}</a></div>
        <div className="flex items-center gap-2 text-slate-500"><MessageCircle size={14} className="text-slate-500" /><a href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-slate-800">{member.whatsapp}</a></div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-1.5 font-medium text-slate-600"><BriefcaseBusiness size={13} className="text-slate-500" />Assigned open tasks</span><span className="font-semibold text-slate-800">{assignedCount} / {member.capacity}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${member.name} workload`} aria-valuenow={workload} aria-valuemin="0" aria-valuemax="100"><div className={`h-full rounded-full ${workload >= 100 ? 'bg-rose-500' : workload >= 70 ? 'bg-amber-500' : 'bg-brand-600'}`} style={{ width: `${workload}%` }} /></div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400"><UserRoundCheck size={12} className="text-slate-500" />{workload}% planned workload</p>
      </div>
    </article>
  )
}
