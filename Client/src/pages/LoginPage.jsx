import { ArrowRight, Check, Database, Map, ShieldCheck, Sparkles, Waves } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'
import { Button } from '../components/ui/Button'
import { ROLE_LIST } from '../constants/roles'
import { useApp } from '../hooks/useApp'
import { cn } from '../utils/cn'

export function LoginPage() {
  const { role, selectRole } = useApp()
  const [selected, setSelected] = useState('manager')
  const navigate = useNavigate()
  const selectedRole = ROLE_LIST.find((item) => item.id === selected)

  if (role) return <Navigate to="/dashboard" replace />

  function enterWorkspace() {
    selectRole(selected)
    navigate('/dashboard')
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.8fr)]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">Interactive prototype</span>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12">
          <p className="mb-3 text-sm font-semibold text-brand-700">Welcome to your workspace</p>
          <h1 className="max-w-lg text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">Turn wetland observations into accountable action.</h1>
          <p className="mt-4 max-w-lg text-[15px] leading-7 text-slate-500">Choose a role to preview TerraLink. This demo uses illustrative records and does not require a password.</p>

          <fieldset className="mt-9">
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.13em] text-slate-400">Continue as</legend>
            <div className="space-y-2.5">
              {ROLE_LIST.map((item) => {
                const Icon = item.icon
                const active = selected === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={cn(
                      'group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
                      active ? 'border-brand-300 bg-brand-50/65 shadow-card' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70',
                    )}
                  >
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', active ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500')}><Icon size={19} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">{item.label}{item.primary && <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Primary</span>}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                    </span>
                    <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border', active ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-transparent')}><Check size={12} strokeWidth={3} /></span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><ShieldCheck size={15} className="text-slate-500" /> {selectedRole.label} access</div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {selectedRole.capabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-2 text-[11px] leading-4 text-slate-500"><Check size={13} className="mt-0.5 shrink-0 text-slate-500" />{capability}</li>
              ))}
            </ul>
          </div>

          <Button type="button" onClick={enterWorkspace} className="mt-6 w-full sm:w-auto sm:self-start">
            Enter workspace <ArrowRight size={17} />
          </Button>
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} /> No credentials or personal data are required.</p>
        </div>

        <p className="text-xs text-slate-400">EraScope · Climate Resilience & Environmental Sustainability</p>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-36 size-[420px] rounded-full border border-white/10" />
        <div className="absolute -right-20 -top-24 size-[300px] rounded-full border border-white/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-brand-100"><Sparkles size={14} className="text-white/70" /> A connected project workflow</span>
          <h2 className="mt-6 max-w-md text-3xl font-semibold leading-tight tracking-tight">Evidence, responsibilities, and costs—kept together.</h2>
        </div>

        <div className="relative my-12 rounded-2xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/15 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div><p className="text-xs text-brand-200">Sample monitoring area</p><p className="mt-1 font-semibold">Pond A · Gazipur</p></div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white"><span className="size-1.5 rounded-full bg-amber-400" />Needs review</span>
          </div>
          <div className="grid grid-cols-2 gap-6 py-6">
            <div><Map size={20} className="text-white/70" /><p className="mt-3 text-2xl font-semibold">5</p><p className="text-xs text-brand-100/70">Monitored sites</p></div>
            <div><Database size={20} className="text-white/70" /><p className="mt-3 text-2xl font-semibold">2019–24</p><p className="text-xs text-brand-100/70">Comparison period</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 text-xs text-brand-50"><Waves size={18} className="text-white/70" /><span>Possible change → Review → Task → Cost → Report</span></div>
        </div>

        <p className="relative max-w-md text-sm leading-6 text-brand-100/70">Designed for NGO project managers and field coordinators protecting ponds and wetlands in Bangladesh.</p>
      </aside>
    </main>
  )
}
