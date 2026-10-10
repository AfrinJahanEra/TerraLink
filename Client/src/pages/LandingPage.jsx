import { ArrowRight, ChevronDown, Database, Mail, Map, Phone, User, Waves } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pondAfter from '../assets/pond-a-after.png'
import { Logo } from '../components/brand/Logo'
import { FeatureShowcase } from '../components/login/FeatureShowcase'
import { Reveal } from '../components/ui/Reveal'

/* Loaded after first paint so the page is never blocked by the 3D bundle. */
const SpaceScene = lazy(() =>
  import('../components/login/SpaceScene').then((module) => ({ default: module.SpaceScene })),
)
const OrbitScene = lazy(() =>
  import('../components/login/OrbitScene').then((module) => ({ default: module.OrbitScene })),
)

const FOOTER_MODULES = ['Dashboard and review queue', 'Wetland map and change analysis', 'Tasks, schedule and budget', 'Reports and Bangla assistant']

export function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const heroShift = Math.min(scrollY * 0.2, 150)
  const heroOpacity = Math.max(1 - scrollY / 620, 0.3)

  return (
    <main className="min-h-screen bg-white">
      {/* Hero: full-width 3D scene */}
      <section className="relative flex min-h-svh flex-col overflow-hidden bg-brand-950 text-white">
        <Suspense fallback={null}>
          <SpaceScene />
        </Suspense>

        <Reveal className="relative z-10 flex items-center justify-between px-5 pt-6 sm:px-10 lg:px-16">
          <Link to="/" aria-label="TerraLink home"><Logo inverse /></Link>
          <div className="flex items-center gap-3">
            <span className="mr-1 hidden rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-brand-100 md:inline-block">
              Interactive prototype
            </span>
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-brand-950 shadow-lg shadow-black/20 transition hover:bg-brand-50"
            >
              Register
            </Link>
          </div>
        </Reveal>

        <div
          className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16 sm:px-10 lg:px-16"
          style={{ transform: `translateY(${heroShift}px)`, opacity: heroOpacity }}
        >
          <Reveal>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">From orbit to the field</p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="max-w-2xl bg-gradient-to-r from-white via-white to-cyan-200 bg-clip-text text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-transparent sm:text-5xl">
              Turn wetland observations into accountable action.
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-brand-100/80">
              TerraLink connects satellite alerts, review decisions, field tasks, costs and reports in one workspace for teams protecting ponds and wetlands in Bangladesh.
            </p>
          </Reveal>
          <Reveal delay={270}>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" /> Sentinel-2 · 5-day revisit
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-brand-100">5 monitored sites</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-brand-100">2019–24 comparison</span>
            </div>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-[15px] font-semibold text-brand-950 shadow-lg shadow-black/25 transition hover:bg-brand-50"
              >
                Register <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 items-center rounded-lg border border-white/25 px-7 text-[15px] font-semibold text-white transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Sample record card floating over the planet (wide screens only) */}
        <Reveal delay={520} className="absolute bottom-24 right-14 z-10 hidden xl:block">
          <div className="w-[330px] animate-[floaty_7s_ease-in-out_1.5s_infinite] rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/20 ring-1 ring-cyan-300/20 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><p className="text-xs text-brand-200">Sample monitoring site</p><p className="mt-1 font-semibold">Haor wetland · Bangladesh</p></div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white"><span className="size-1.5 animate-pulse rounded-full bg-amber-400" />Needs review</span>
            </div>
            <div className="grid grid-cols-2 gap-6 py-5">
              <div><Map size={20} className="text-white/70" /><p className="mt-3 text-2xl font-semibold">5</p><p className="text-xs text-brand-100/70">Monitored sites</p></div>
              <div><Database size={20} className="text-white/70" /><p className="mt-3 text-2xl font-semibold">2019–24</p><p className="text-xs text-brand-100/70">Comparison period</p></div>
            </div>
          </div>
        </Reveal>

        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-white/35"><ChevronDown size={18} /></div>
      </section>

      {/* Satellite view with animated 3D backdrop */}
      <section id="satellite" className="relative overflow-hidden bg-white">
        {/* Wireframe globe + orbiting satellite behind the photo */}
        <div className="pointer-events-none absolute -left-28 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 md:block">
          <Suspense fallback={null}>
            <OrbitScene />
          </Suspense>
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-20 px-5 py-28 sm:px-10 md:flex-row md:gap-16 lg:px-16">
          {/* HUD-style circular satellite image */}
          <Reveal className="relative shrink-0">
            <div className="relative size-52 md:size-60">
              {/* Targeting brackets */}
              <span aria-hidden="true" className="absolute -left-3 -top-3 size-7 rounded-tl-xl border-l-2 border-t-2 border-brand-300" />
              <span aria-hidden="true" className="absolute -right-3 -top-3 size-7 rounded-tr-xl border-r-2 border-t-2 border-brand-300" />
              <span aria-hidden="true" className="absolute -bottom-3 -left-3 size-7 rounded-bl-xl border-b-2 border-l-2 border-brand-300" />
              <span aria-hidden="true" className="absolute -bottom-3 -right-3 size-7 rounded-br-xl border-b-2 border-r-2 border-brand-300" />
              {/* Rotating dashed halo */}
              <div aria-hidden="true" className="absolute -inset-5 animate-[spin-slow_44s_linear_infinite] rounded-full border border-dashed border-slate-200" />
              <div className="absolute inset-0 rounded-full border border-cyan-200/80" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin-slow_28s_linear_infinite]">
                <circle
                  cx="50"
                  cy="50"
                  r="48.5"
                  fill="none"
                  stroke="rgba(6,182,212,0.9)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray="230 775"
                />
              </svg>
              {/* Small beacon riding the ring, like a satellite circling the site */}
              <div className="absolute inset-0 animate-[spin-slow_16s_linear_infinite_reverse]">
                <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              </div>
              {/* Radar sweep across the imagery */}
              <div className="absolute inset-[7px] overflow-hidden rounded-full">
                <div aria-hidden="true" className="absolute inset-0 animate-[spin-slow_7s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.30)_55deg,transparent_100deg)]" />
              </div>
              <img
                src={pondAfter}
                alt="Aerial view of a monitored wetland"
                className="absolute inset-[7px] size-[calc(100%-14px)] rounded-full object-cover"
              />
              {/* Generic alert chip */}
              <div className="absolute -bottom-8 -right-4 z-10 w-48 rounded-xl border border-slate-200 bg-white p-3.5 shadow-pop md:-right-8">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Possible change detected
                </p>
                <p className="mt-1 text-[10px] text-slate-400">Water area −20.8% vs 2019 season</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140} className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><span className="size-1.5 rounded-full bg-cyan-500" /> Satellite view · Sample imagery</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Orbit watches the water. The team acts on it.</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-500">
              A satellite alert about shrinking water area becomes a reviewed decision, an assigned field visit and a documented cost — in one workspace.
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>23.8° N, 90.4° E · Bangladesh</span>
              <span>Sentinel-2 · 10 m resolution</span>
              <span>2019–24 comparison</span>
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-600">
              <Waves size={16} className="text-slate-400" /> <span>Possible change → Review → Task → Cost → Report</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Features, shown one by one */}
      <FeatureShowcase />

      {/* Footer */}
      <footer className="bg-brand-950 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo inverse />
            <p className="mt-4 max-w-xs text-sm leading-6 text-brand-100/70">
              A wetland monitoring and response workspace for NGO project teams in Bangladesh.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Workspace</p>
            <ul className="mt-4 space-y-2 text-sm text-brand-100/80">
              {FOOTER_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Developer</p>
            <ul className="mt-4 space-y-2.5 text-sm text-brand-100/80">
              <li className="flex items-center gap-2.5"><User size={15} className="shrink-0 text-brand-300" /> Afrin Jahan Era</li>
              <li className="flex items-center gap-2.5"><Mail size={15} className="shrink-0 text-brand-300" /> afrinera@iut-dhaka.edu</li>
              <li className="flex items-center gap-2.5"><Phone size={15} className="shrink-0 text-brand-300" /> 01308453214</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-5 text-xs text-brand-100/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>TerraLink · Interactive prototype with sample data</span>
            <span>Islamic University of Technology, Dhaka</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
