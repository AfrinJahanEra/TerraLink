import { Database, Globe2, Info, ShieldCheck, X } from 'lucide-react'
import { useEffect } from 'react'

const sections = [
  {
    title: 'Real services',
    icon: Globe2,
    items: [
      'EOX Sentinel-2 cloudless and Esri/OpenStreetMap imagery layers',
      'EmailJS delivery when project credentials are configured',
      'Google Identity Services OAuth and Google Calendar API events',
      'WhatsApp wa.me click-to-chat links that a person confirms',
    ],
  },
  {
    title: 'Simulated or illustrative',
    icon: Database,
    items: [
      'Five demonstration sites, contacts, tasks, decisions, and costs',
      'Visible-water measurements and change percentages',
      'Bangla Assistant responses generated from deterministic templates',
      'All workspace records stored locally in this browser',
    ],
  },
]

export function AboutPanel({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="about-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close About and Help" />
      <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-lg flex-col bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Info size={18} /></span><div><h2 id="about-title" className="text-sm font-semibold text-slate-900">About this demonstration</h2><p className="mt-0.5 text-xs text-slate-500">Real services and simulated evidence, clearly separated.</p></div></div><button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button></div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-slate-600" /><p className="text-xs leading-5 text-slate-700"><strong>Interpretation rule:</strong> a detected change is a prompt for human review. It is not proof of encroachment, ecological loss, or legal non-compliance.</p></div></div>
          <div className="mt-5 space-y-5">{sections.map(({ title, icon: Icon, items }) => <section key={title}><div className="flex items-center gap-2"><Icon size={16} className="text-slate-500" /><h3 className="text-xs font-semibold text-slate-800">{title}</h3></div><ul className="mt-3 space-y-2 border-l border-slate-200 pl-4">{items.map((item) => <li key={item} className="text-xs leading-5 text-slate-500">{item}</li>)}</ul></section>)}</div>
          <section className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-xs font-semibold text-slate-800">Demo safeguards</h3><p className="mt-2 text-xs leading-5 text-slate-500">Missing provider keys, OAuth cancellation, or quota errors are caught and written to the notification log. Reset demo restores the seeded sample workspace.</p></section>
        </div>
      </aside>
    </div>
  )
}
