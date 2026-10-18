import { Landmark, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatBdtBangla } from '../../utils/currency'
import { Button } from '../ui/Button'

export function BudgetAllocationModal({ open, site, planned, onClose, onSave }) {
  const [amount, setAmount] = useState(String(planned ?? 0))

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open || !site) return null

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="allocation-modal-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close allocation form" />
      <section className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Landmark size={17} /></span><div><h2 id="allocation-modal-title" className="text-sm font-semibold text-slate-900">Edit site budget</h2><p className="mt-0.5 text-xs text-slate-500">{site.name} · {site.location}</p></div></div><button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button></div>
        <form onSubmit={(event) => { event.preventDefault(); onSave(Number(amount)) }} className="space-y-4 p-5">
          <label className="block"><span className="text-xs font-semibold text-slate-700">Planned allocation (BDT)</span><input type="number" min="0" step="100" value={amount} onChange={(event) => setAmount(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /><span className="mt-1 block text-[10px] text-slate-400">বাংলা: {formatBdtBangla(amount)}</span></label>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save allocation <Save size={15} /></Button></div>
        </form>
      </section>
    </div>
  )
}
