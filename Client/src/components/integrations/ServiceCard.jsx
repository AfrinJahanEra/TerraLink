import { LoaderCircle } from 'lucide-react'
import { Button } from '../ui/Button'

export function ServiceCard({
  icon: Icon,
  name,
  description,
  connected,
  statusLabel,
  rules,
  settings,
  onToggleRule,
  onTest,
  testing,
  connectionAction,
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon size={19} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">{name}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
          <span className={`size-1.5 rounded-full ${connected ? 'bg-brand-600' : 'bg-amber-500'}`} />{statusLabel}
        </span>
      </div>

      <div className="mt-5 flex-1 border-t border-slate-100 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Automation rules</p>
        <div className="mt-2 divide-y divide-slate-100">
          {rules.map((rule) => (
            <label key={rule.id} className="flex cursor-pointer items-center justify-between gap-4 py-3">
              <span><span className="block text-xs font-semibold text-slate-700">{rule.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{rule.description}</span></span>
              <span className="relative shrink-0">
                <input type="checkbox" checked={settings.rules[rule.id]} onChange={(event) => onToggleRule(rule.id, event.target.checked)} className="peer sr-only" />
                <span className="block h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-brand-600" />
                <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {connectionAction}
        <Button type="button" variant="secondary" onClick={onTest} disabled={testing} className="flex-1">
          {testing ? <LoaderCircle size={15} className="animate-spin" /> : null}{testing ? 'Sending...' : 'Send test'}
        </Button>
      </div>
    </article>
  )
}
