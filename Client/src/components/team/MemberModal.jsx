import { Mail, MessageCircle, Save, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'

const roles = ['Project Manager', 'Field Coordinator', 'Office Operator', 'GIS Analyst', 'Finance Officer']

export function MemberModal({ open, member, onClose, onSave }) {
  const [name, setName] = useState(member?.name ?? '')
  const [role, setRole] = useState(member?.role ?? 'Field Coordinator')
  const [email, setEmail] = useState(member?.email ?? '')
  const [whatsapp, setWhatsapp] = useState(member?.whatsapp ?? '+880 ')
  const [availability, setAvailability] = useState(member?.availability ?? 'available')
  const [capacity, setCapacity] = useState(String(member?.capacity ?? 4))

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  function submit(event) {
    event.preventDefault()
    const initials = name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    onSave({ name: name.trim(), initials, role, email: email.trim(), whatsapp: whatsapp.trim(), availability, capacity: Number(capacity) })
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="member-modal-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close member form" />
      <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600">{member ? <Save size={17} /> : <UserPlus size={17} />}</span><div><h2 id="member-modal-title" className="text-sm font-semibold text-slate-900">{member ? 'Edit team member' : 'Add team member'}</h2><p className="mt-0.5 text-xs text-slate-500">Maintain contact, role, and availability details.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block"><span className="text-xs font-semibold text-slate-700">Full name</span><input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Role</span><select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400"><option value="available">Available</option><option value="limited">Limited availability</option><option value="leave">On leave</option></select></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Mail size={14} className="text-slate-500" />Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
            <label className="block"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><MessageCircle size={14} className="text-slate-500" />WhatsApp number</span><input type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} required pattern="[+0-9 ()-]{8,}" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
          </div>
          <label className="block"><span className="text-xs font-semibold text-slate-700">Open-task capacity</span><input type="number" min="1" max="20" value={capacity} onChange={(event) => setCapacity(event.target.value)} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-brand-400" /><span className="mt-1 block text-[10px] text-slate-400">Used to calculate the workload bar.</span></label>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{member ? 'Save changes' : 'Add member'} <Save size={15} /></Button></div>
        </form>
      </section>
    </div>
  )
}
