import { isTaskClosed } from '../../constants/status'
import {
  Activity,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileText,
  Languages,
  ListChecks,
  Pause,
  Play,
  Satellite,
  ScanLine,
  Wallet,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pondAfter from '../../assets/pond-a-after.png'
import { useApp } from '../../hooks/useApp'
import { cn } from '../../utils/cn'
import { Reveal } from '../ui/Reveal'

const SpaceScene = lazy(() =>
  import('./SpaceScene').then((module) => ({ default: module.SpaceScene })),
)

const AUTO_ADVANCE_MS = 2000

const FEATURES = [
  {
    id: 'detection',
    icon: Satellite,
    eyebrow: 'Map and site analysis',
    title: 'See wetland change before it becomes loss',
    description: 'Open monitored sites from one map, compare seasonal imagery and move directly from an observation into a documented response.',
    capabilities: ['Explore every monitored site spatially', 'Compare before-and-after water extent', 'Keep source, date and confidence together'],
  },
  {
    id: 'review',
    icon: ClipboardCheck,
    eyebrow: 'Review queue',
    title: 'Turn every alert into an accountable decision',
    description: 'Project managers and GIS analysts review the same evidence, record a reason and preserve who made each decision.',
    capabilities: ['Confirm change or record no change', 'Request a field inspection with context', 'Preserve a complete decision trail'],
  },
  {
    id: 'tasks',
    icon: ListChecks,
    eyebrow: 'Field operations',
    title: 'Carry decisions into assigned field work',
    description: 'Create structured tasks with ownership, due dates, evidence, progress and approvals that remain connected to the originating site.',
    capabilities: ['Assign work by role and availability', 'Track comments, evidence and status', 'Send calendar and email actions'],
  },
  {
    id: 'budget',
    icon: Wallet,
    eyebrow: 'Budget and expenses',
    title: 'Keep programme spending beside delivery',
    description: 'Compare planned and actual spend by site, connect expenses to field work and surface budget pressure while action is still possible.',
    capabilities: ['Set site-level budget allocations', 'Record task-linked expenses', 'Monitor remaining and pending commitments'],
  },
  {
    id: 'reports',
    icon: FileText,
    eyebrow: 'Reports and audit trail',
    title: 'Build evidence-ready reporting from live records',
    description: 'Compile site observations, decisions, tasks and costs into a consistent report without rebuilding the story in separate documents.',
    capabilities: ['Generate structured programme summaries', 'Include delivery and cost evidence', 'Share reports with recorded recipients'],
  },
  {
    id: 'assistant',
    icon: Languages,
    eyebrow: 'Bangla assistant',
    title: 'Make workspace answers accessible to field teams',
    description: 'Ask operational questions in Bangla and receive guidance grounded in the same site, task and budget records used by the team.',
    capabilities: ['Use Bangla or English questions', 'Find site and task context quickly', 'Guide users toward the correct workflow'],
  },
]

function OrbitFeatureVisual({ activeFeature, activeIndex, metric }) {
  return (
    <div className="feature-orbit-visual relative min-h-[440px] overflow-hidden lg:min-h-[590px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_40%,rgba(70,178,178,0.28),transparent_46%)]" />
      <div className="feature-orbit-grid pointer-events-none absolute inset-0 opacity-50" />
      <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_42%,rgba(70,178,178,0.2),transparent_42%)]" />}>
        <SpaceScene variant="feature" />
      </Suspense>

      <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/15 bg-brand-950/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 backdrop-blur-md">
        <span className="feature-status-dot size-1.5 rounded-full bg-cyan-200" />
        Connected workspace
      </div>
      <div className="absolute right-5 top-5 z-10 hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-100/55 sm:flex">
        <Activity size={13} className="text-cyan-200" /> Live orbital context
      </div>

      <span aria-hidden="true" className="absolute left-4 top-20 z-10 h-14 w-px bg-gradient-to-b from-cyan-100/60 to-transparent" />
      <span aria-hidden="true" className="absolute right-4 top-20 z-10 h-20 w-px bg-gradient-to-b from-cyan-100/35 to-transparent" />

      <div className="absolute bottom-8 left-6 z-10 size-32 sm:size-40">
        <span aria-hidden="true" className="feature-radar-ring absolute -inset-5 rounded-full border border-cyan-100/20" />
        <span aria-hidden="true" className="absolute -inset-2 animate-[spin-slow_36s_linear_infinite] rounded-full border border-dashed border-white/30" />
        <span aria-hidden="true" className="absolute -left-3 -top-3 size-7 rounded-tl-lg border-l border-t border-cyan-100/70" />
        <span aria-hidden="true" className="absolute -bottom-3 -right-3 size-7 rounded-br-lg border-b border-r border-cyan-100/70" />
        <img src={pondAfter} alt="Satellite view of a monitored wetland" className="size-full rounded-full border-4 border-white/15 object-cover shadow-2xl shadow-black/35" />
        <div aria-hidden="true" className="absolute inset-1 overflow-hidden rounded-full">
          <div className="absolute inset-0 animate-[spin-slow_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(165,243,252,0.4)_55deg,transparent_105deg)]" />
        </div>
        <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-brand-950/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-100/75 backdrop-blur-md">
          <ScanLine size={10} /> Site feed
        </div>
      </div>

      <div key={activeFeature.id} className="feature-telemetry-card absolute bottom-8 right-5 z-10 w-52 overflow-hidden rounded-2xl border border-white/15 bg-brand-950/80 p-4 text-white shadow-2xl shadow-black/20 backdrop-blur-xl sm:w-64">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-200">{activeFeature.eyebrow}</p>
          <span className="text-[9px] font-bold text-white/35">{String(activeIndex + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}</span>
        </div>
        <div className="mt-3 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/8 text-cyan-100"><Database size={14} /></span>
          <div>
            <p className="text-sm font-semibold leading-5">{metric}</p>
            <p className="mt-1 text-[11px] leading-4 text-white/50">Synchronized with the TerraLink workspace</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeatureShowcase() {
  const { sites, tasks, decisions, teamMembers, budgetSummary, expenses } = useApp()
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [manualPaused, setManualPaused] = useState(false)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const paused = manualPaused || interactionPaused
  const activeFeature = FEATURES[activeIndex]
  const ActiveIcon = activeFeature.icon

  const metrics = {
    detection: `${sites.length} monitored sites`,
    review: `${sites.filter((site) => site.status === 'needs_review').length} sites awaiting review`,
    tasks: `${tasks.filter((task) => !isTaskClosed(task)).length} active tasks`,
    budget: `BDT ${Number(budgetSummary?.spent ?? 0).toLocaleString('en-BD')} recorded`,
    reports: `${expenses.length} verified expense records`,
    assistant: `${teamMembers.length} team members supported`,
  }
  const activeMetric = metrics[activeFeature.id]
  const recordedDecisionCount = Object.keys(decisions).length

  useEffect(() => {
    if (paused) return undefined
    const timer = window.setTimeout(() => {
      setDirection(1)
      setActiveIndex((current) => (current + 1) % FEATURES.length)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [activeIndex, paused])

  const showFeature = (nextIndex, nextDirection) => {
    setDirection(nextDirection)
    setActiveIndex((nextIndex + FEATURES.length) % FEATURES.length)
  }

  const resumeAfterFocus = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false)
  }

  return (
    <section id="features" className="feature-showcase-shell relative scroll-mt-10 overflow-hidden bg-brand-950 py-16 text-white sm:py-20">
      <div className="feature-showcase-grid pointer-events-none absolute inset-0" />
      <div className="feature-aurora pointer-events-none absolute -right-40 top-1/4 size-[620px] rounded-full bg-brand-500/10 blur-[110px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/30 to-transparent" />

      <div className="relative mx-auto w-full max-w-[1640px] px-10 sm:px-16 lg:px-20">
        <div
          className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:gap-8"
          onFocusCapture={() => setInteractionPaused(true)}
          onBlurCapture={resumeAfterFocus}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') showFeature(activeIndex - 1, -1)
            if (event.key === 'ArrowRight') showFeature(activeIndex + 1, 1)
          }}
        >
          <div className="relative z-10 min-w-0 lg:py-4">
            <Reveal className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-brand-300/70" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-300">The TerraLink workspace</p>
                <span className="flex items-center gap-1.5 rounded-full border border-cyan-100/15 bg-cyan-100/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-100/70">
                  <span className="feature-status-dot size-1.5 rounded-full bg-cyan-200" /> Live
                </span>
              </div>
              <h2 className="mt-4 max-w-xl text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-white sm:text-4xl lg:text-[2.75rem]">One operating system for wetland action</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-brand-100/65 sm:text-[15px]">
                Real workspace modules rotate here while the live Earth layer keeps the complete observation-to-action workflow in view.
              </p>

              <div className="mt-6 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black/10 backdrop-blur-sm">
                {[
                  [sites.length, 'Monitored sites'],
                  [tasks.length, 'Field tasks'],
                  [recordedDecisionCount, 'Decisions'],
                ].map(([value, label], index) => (
                  <div key={label} className={cn('px-3 py-3.5 sm:px-4', index > 0 && 'border-l border-white/10')}>
                    <span className="block text-lg font-bold tracking-tight text-white">{value}</span>
                    <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.13em] text-brand-100/45">{label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="feature-card-stage mt-6">
              <div
                key={activeFeature.id}
                className={cn(
                  'feature-card-enter feature-landscape-card relative overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.105),rgba(255,255,255,0.035))] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7',
                  direction < 0 && 'feature-card-enter-reverse',
                )}
              >
                <span className={cn('feature-card-progress absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-brand-300 via-cyan-100 to-brand-300', paused && 'feature-card-progress-paused')} />
                <span aria-hidden="true" className="absolute -right-3 -top-8 text-[8rem] font-bold leading-none tracking-[-0.08em] text-white/[0.025]">{String(activeIndex + 1).padStart(2, '0')}</span>
                <div className="absolute inset-y-10 left-0 w-px bg-gradient-to-b from-transparent via-brand-300/90 to-transparent" />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="feature-icon-glow grid size-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white text-brand-950 shadow-lg shadow-cyan-950/30">
                      <ActiveIcon size={19} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">Module {String(activeIndex + 1).padStart(2, '0')}</p>
                      <p className="mt-0.5 text-xs font-semibold text-white/70">{activeFeature.eyebrow}</p>
                    </div>
                  </div>
                  <span className="hidden rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-[10px] font-semibold text-brand-100/70 sm:inline-flex">{activeMetric}</span>
                </div>

                <div className="relative mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_210px] sm:gap-7">
                  <div>
                    <h3 className="max-w-md text-xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-[1.65rem]">{activeFeature.title}</h3>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-brand-100/65">{activeFeature.description}</p>
                    <Link to="/register" className="group mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white px-4 text-xs font-bold text-brand-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-brand-50">
                      Access the workspace <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-300">Core capabilities</p>
                    <ul className="mt-3 space-y-3">
                      {activeFeature.capabilities.map((capability, index) => (
                        <li key={capability} className="feature-capability flex items-start gap-2.5 text-xs leading-5 text-brand-100/65" style={{ animationDelay: `${index * 80}ms` }}>
                          <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-brand-300/30 bg-brand-300/10 text-cyan-100"><Check size={10} /></span>
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => showFeature(activeIndex - 1, -1)} className="feature-control grid size-11 place-items-center rounded-full border border-white/15 bg-white/[0.025] text-white/70 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white" aria-label="Show previous feature">
                  <ChevronLeft size={19} />
                </button>
                <button type="button" onClick={() => showFeature(activeIndex + 1, 1)} className="feature-control grid size-11 place-items-center rounded-full bg-white text-brand-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-brand-100" aria-label="Show next feature">
                  <ChevronRight size={19} />
                </button>
                <button type="button" onClick={() => setManualPaused((current) => !current)} className="feature-control grid size-11 place-items-center rounded-full border border-white/15 bg-white/[0.025] text-white/70 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white" aria-label={manualPaused ? 'Resume automatic feature rotation' : 'Pause automatic feature rotation'}>
                  {manualPaused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold tabular-nums tracking-[0.12em] text-white/45">{String(activeIndex + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}</span>
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose a TerraLink feature">
                  {FEATURES.map((feature, index) => (
                    <button key={feature.id} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Show feature ${index + 1}: ${feature.title}`} onClick={() => showFeature(index, index >= activeIndex ? 1 : -1)} className={cn('h-1.5 rounded-full transition-all duration-300', index === activeIndex ? 'w-8 bg-cyan-100 shadow-[0_0_12px_rgba(165,243,252,0.45)]' : 'w-2 bg-white/20 hover:bg-white/45')} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Reveal delay={120} className="min-w-0">
            <OrbitFeatureVisual activeFeature={activeFeature} activeIndex={activeIndex} metric={activeMetric} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
