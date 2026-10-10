import { ChevronLeft, ChevronRight, ClipboardCheck, FileText, Languages, ListChecks, Satellite, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

/* ---------- Sample UI mock previews (static, illustrative only) ---------- */

function DetectionPreview() {
  return (
    <div className="relative h-56 overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 via-white to-brand-50 ring-1 ring-slate-200/70">
      {/* Water bodies and fields */}
      <div className="absolute left-6 top-8 size-28 rounded-[42%] bg-brand-200/70" />
      <div className="absolute left-16 top-24 size-16 rounded-[45%] bg-brand-300/60" />
      <div className="absolute right-8 top-6 size-20 rounded-[40%] bg-emerald-100/90" />
      <div className="absolute bottom-6 right-16 size-14 rounded-[45%] bg-brand-100" />
      <div className="absolute bottom-10 left-10 size-12 rounded-[40%] bg-emerald-50 ring-1 ring-emerald-100" />
      {/* 2019 extent vs 2024 extent */}
      <div className="absolute left-[46px] top-[40px] size-24 rounded-[42%] border-2 border-dashed border-brand-400/80" />
      <div className="absolute left-[62px] top-[56px] size-14 rounded-[42%] border-2 border-rose-300/90 bg-rose-50/40" />
      {/* Alert marker */}
      <span className="absolute left-[104px] top-[66px] flex size-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
        <span className="relative size-3 rounded-full bg-amber-500 ring-2 ring-white" />
      </span>
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-card ring-1 ring-slate-200">
        <span className="size-1.5 rounded-full bg-amber-500" /> Water area −20.8% · Sample site
      </span>
    </div>
  )
}

function ReviewPreview() {
  const rows = [
    { name: 'Wetland site 01', status: 'Needs review', dot: 'bg-amber-500' },
    { name: 'Wetland site 02', status: 'Needs review', dot: 'bg-amber-500' },
    { name: 'Wetland site 03', status: 'No change', dot: 'bg-emerald-500' },
  ]
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Review queue</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">2 pending</span>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
            <span className={cn('size-1.5 shrink-0 rounded-full', row.dot)} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{row.name}</span>
            <span className="shrink-0 text-[10px] text-slate-400">{row.status}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="rounded-lg bg-brand-700 px-3 py-2 text-center text-[11px] font-semibold text-white">Confirm change</span>
        <span className="rounded-lg border border-slate-200 px-3 py-2 text-center text-[11px] font-semibold text-slate-600">Request inspection</span>
      </div>
    </div>
  )
}

function TasksPreview() {
  const tasks = [
    { title: 'Inspect embankment at wetland site 01', progress: 66, initials: 'RH' },
    { title: 'Measure water level at wetland site 02', progress: 33, initials: 'SM' },
    { title: 'Photograph inflow point at site 03', progress: 100, initials: 'KR' },
  ]
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Field tasks</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">3 of 24 open</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {tasks.map((task) => (
          <li key={task.title} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
            <span className={cn('grid size-4.5 shrink-0 place-items-center rounded border', task.progress === 100 ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-transparent')}>
              <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 6.5 4.8 9 10 3.5" /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-slate-700">{task.title}</span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-brand-600" style={{ width: `${task.progress}%` }} />
              </span>
            </span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">{task.initials}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BudgetPreview() {
  const bars = [42, 58, 50, 74, 62, 92]
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Planned vs actual · BDT lakh</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
          <span className="size-1 rounded-full bg-rose-500" /> 1 over plan
        </span>
      </div>
      <div className="mt-4 flex h-32 items-end gap-3">
        {bars.map((height, index) => (
          <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className={cn('w-full rounded-t-md', index === bars.length - 1 ? 'bg-rose-400/80' : 'bg-brand-600/85')}
              style={{ height: `${height}%` }}
            />
            <span className="text-[9px] text-slate-400">M{index + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-brand-600/85" /> Actual spend</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-rose-400/80" /> Over plan</span>
      </div>
    </div>
  )
}

function ReportsPreview() {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">Quarterly impact report</p>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">SAMPLE</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-11/12 rounded bg-slate-100" />
        <div className="h-2 w-4/5 rounded bg-slate-100" />
        <div className="h-2 w-3/5 rounded bg-slate-100" />
      </div>
      <div className="mt-5 flex h-16 items-end gap-1.5">
        {[38, 55, 44, 68, 58, 76, 64].map((height, index) => (
          <div key={index} className="flex h-full flex-1 items-end">
            <div className="w-full rounded-t bg-brand-200" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['5 sites', '24 tasks', 'BDT 8.2L spend'].map((chip) => (
          <span key={chip} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">{chip}</span>
        ))}
      </div>
    </div>
  )
}

function AssistantPreview() {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/70">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assistant · Sample conversation</p>
      <div className="mt-3 max-w-[85%] rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-[13px] leading-5 text-slate-700">
        পুকুরের পানি কমছে — এখন কী করতে পারি?
      </div>
      <div className="ml-auto mt-3 max-w-[85%] rounded-2xl rounded-tr-md bg-brand-700 px-3.5 py-2.5 text-[13px] leading-5 text-white">
        স্যাটেলাইট তুলনা যাচাই করে রিভিউ সিদ্ধান্ত নিন, তারপর ফিল্ড দলকে পরিদর্শনের কাজ অ্যাসাইন করুন।
      </div>
      <div className="mt-3 flex items-center gap-1 pl-1" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="assistant-dot size-1.5 rounded-full bg-slate-300" style={{ animationDelay: `${dot * 150}ms` }} />
        ))}
      </div>
    </div>
  )
}

/* ---------- Feature data ---------- */

const FEATURES = [
  {
    id: 'detection',
    icon: Satellite,
    title: 'Satellite change detection',
    description:
      'Sentinel-2 imagery compares water area between the 2019 and 2024 seasons and raises an alert whenever a pond or wetland starts shrinking.',
    preview: <DetectionPreview />,
  },
  {
    id: 'review',
    icon: ClipboardCheck,
    title: 'Review queue and decisions',
    description:
      'Every alert lands in one review queue. Confirm the change, mark it as no change, or send the site for field inspection — each decision is recorded with your role and reason.',
    preview: <ReviewPreview />,
  },
  {
    id: 'tasks',
    icon: ListChecks,
    title: 'Tasks, visits and evidence',
    description:
      'Turn a decision into assigned field work with due dates, progress updates, comments and recorded evidence, so delivery is visible without phone calls.',
    preview: <TasksPreview />,
  },
  {
    id: 'budget',
    icon: Wallet,
    title: 'Budgets linked to work',
    description:
      'Planned versus actual spending stays visible per programme, and field costs are recorded against the task they belong to — over-budget lines surface immediately.',
    preview: <BudgetPreview />,
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'Reports in one click',
    description:
      'Compile site, task and cost records into a formatted report with charts and an audit trail, ready to share with donors and boards.',
    preview: <ReportsPreview />,
  },
  {
    id: 'assistant',
    icon: Languages,
    title: 'Assistant in Bangla',
    description:
      'Field teams can ask questions in Bangla and get answers grounded in their own workspace data, from site history to overdue tasks.',
    preview: <AssistantPreview />,
  },
]

const AUTO_ADVANCE_MS = 4500

/* ---------- Showcase: features appear one by one ---------- */

export function FeatureShowcase() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return undefined
    const timer = setInterval(() => setIndex((current) => (current + 1) % FEATURES.length), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [paused])

  const active = FEATURES[index]
  const Icon = active.icon
  const step = (direction) => setIndex((current) => (current + direction + FEATURES.length) % FEATURES.length)

  return (
    <section id="features" className="scroll-mt-10 bg-white py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Inside the workspace</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">From first alert to final report</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Six connected modules hand work to each other, so an observation in orbit becomes a documented, costed field response.
          </p>
        </div>

        <div
          className="mt-12 grid gap-10 lg:grid-cols-[320px_1fr]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Step list */}
          <ol className="space-y-1.5">
            {FEATURES.map((feature, featureIndex) => (
              <li key={feature.id}>
                <button
                  type="button"
                  onClick={() => setIndex(featureIndex)}
                  className={cn(
                    'relative w-full overflow-hidden rounded-xl p-4 text-left transition-colors duration-200',
                    featureIndex === index ? 'bg-brand-50/70 ring-1 ring-brand-100' : 'hover:bg-slate-50',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn('text-xs font-bold tabular-nums', featureIndex === index ? 'text-brand-700' : 'text-slate-400')}>
                      0{featureIndex + 1}
                    </span>
                    <span className={cn('text-sm font-semibold', featureIndex === index ? 'text-brand-900' : 'text-slate-600')}>
                      {feature.title}
                    </span>
                  </span>
                  {featureIndex === index && (
                    <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-0.5 overflow-hidden rounded-full bg-brand-100">
                      <span key={index} className="block h-full animate-[feature-progress_4.5s_linear_forwards] bg-brand-600" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>

          {/* Active feature panel */}
          <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-6 sm:p-8">
            <div className="absolute right-5 top-5 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous feature"
                className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-700"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next feature"
                className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-700"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            <div key={active.id} className="animate-[role-swap_320ms_ease-out]">
              <div className="flex items-center gap-3.5 pr-20">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-700 text-white"><Icon size={20} /></span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Step 0{index + 1} of 0{FEATURES.length}</p>
                  <h3 className="text-lg font-bold tracking-tight text-slate-950">{active.title}</h3>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{active.description}</p>
              <div className="mt-6">{active.preview}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
