import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROLE_LIST } from '../../constants/roles'
import { cn } from '../../utils/cn'
import { Logo } from '../brand/Logo'
import { Button } from '../ui/Button'

export function AuthField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  )
}

const HIGHLIGHTS = [
  'Review satellite alerts and record decisions',
  'Assign field work and track delivery',
  'Link every cost to a task and report outcomes',
]

/*
 * Split-screen auth layout: dark brand panel on the left, form on the right.
 * Role selection lives here so the landing page stays a clean marketing page.
 */
export function AuthShell({ eyebrow, title, description, role, onRoleChange, submitLabel, onSubmit, alternate, children }) {
  return (
    <main className="grid min-h-svh bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-12 text-white lg:flex xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="absolute right-14 top-24 size-56 rounded-full border border-white/10" />
          <div className="absolute right-24 top-36 size-36 rounded-full border border-dashed border-cyan-300/20" />
          <div className="absolute bottom-24 right-40 size-20 rounded-full border border-white/10" />
        </div>
        <Link to="/" className="relative w-fit"><Logo inverse /></Link>
        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">From orbit to the field</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            One workspace from satellite alert to field report.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-100/85">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-cyan-300">
                  <Check size={12} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-100/50">Interactive prototype · Sample data only · No real authentication</p>
      </aside>

      {/* Form column */}
      <section className="flex flex-col px-5 py-8 sm:px-10 lg:justify-center lg:py-12">
        <div className="mb-10 flex items-center justify-between lg:hidden">
          <Link to="/" aria-label="TerraLink home"><Logo /></Link>
          <Link to="/" className="text-xs font-semibold text-slate-400 transition hover:text-slate-600">Back to home</Link>
        </div>

        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-4">{children}</div>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-600">Continue as</legend>
              <div className="space-y-2">
                {ROLE_LIST.map((item) => {
                  const Icon = item.icon
                  const active = role === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onRoleChange(item.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
                        active
                          ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600/25'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      )}
                    >
                      <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', active ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500')}>
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                          {item.label}
                          {item.primary && <span className="text-[9px] font-bold uppercase tracking-wider text-brand-700">Primary</span>}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{item.description}</span>
                      </span>
                      <span className={cn('grid size-4.5 shrink-0 place-items-center rounded-full border-2 transition', active ? 'border-brand-600' : 'border-slate-300')}>
                        {active && <span className="size-2 rounded-full bg-brand-600" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <Button type="submit" className="h-11 w-full">{submitLabel}</Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">{alternate}</p>
          <p className="mt-8 hidden text-center text-[11px] leading-5 text-slate-400 lg:block">
            This prototype performs no real authentication. Your role only changes what the demo workspace shows, and you can switch it anytime from the top bar.
          </p>
        </div>
      </section>
    </main>
  )
}
