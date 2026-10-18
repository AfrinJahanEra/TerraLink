import { ArrowRight, Camera, ChevronDown, Mail, Phone, User, Waves } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import bangladeshWetlandHero from '../assets/bangladesh-wetland-hero.png'
import pondAfter from '../assets/pond-a-after.png'
import { Logo } from '../components/brand/Logo'
import { FeatureShowcase } from '../components/login/FeatureShowcase'
import { Reveal } from '../components/ui/Reveal'
import { dashboardSites } from '../data/dashboard'

const OrbitScene = lazy(() =>
  import('../components/login/OrbitScene').then((module) => ({ default: module.OrbitScene })),
)

const FOOTER_MODULES = ['Wetland map and community photo reports', 'Satellite comparison and sites register', 'Tasks, schedule and budget', 'Reports and Bangla assistant']
const HERO_SATELLITE = dashboardSites.find((site) => site.id === 'hatirjheel')?.image ?? pondAfter

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

  const photoShift = Math.min(scrollY * 0.12, 72)
  const heroOpacity = Math.max(1 - scrollY / 760, 0.35)

  return (
    <main className="min-h-screen bg-white">
      {/* Hero: real wetland imagery with production-style content overlay */}
      <section className="relative flex min-h-svh flex-col overflow-hidden bg-brand-950 text-white">
        <div
          className="absolute -inset-y-10 left-0 h-[calc(100%+5rem)] w-full overflow-hidden will-change-transform"
          style={{ transform: `translateY(${photoShift}px)` }}
        >
          <img
            src={bangladeshWetlandHero}
            alt="Aerial view of a Bangladesh wetland, rice fields and rural settlements"
            className="hero-wetland-image size-full object-cover object-center"
            fetchPriority="high"
            onError={(event) => {
              event.currentTarget.src = pondAfter
            }}
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,25,27,0.92)_0%,rgba(4,25,27,0.74)_43%,rgba(4,25,27,0.2)_74%,rgba(4,25,27,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,25,27,0.56)_0%,transparent_28%,transparent_70%,rgba(4,25,27,0.48)_100%)]" />

        <Reveal className="relative z-10 flex items-center justify-between px-5 pt-6 sm:px-10 lg:px-16">
          <Link to="/" aria-label="TerraLink home"><Logo inverse /></Link>
          <div className="flex items-center gap-3">
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
          className="relative z-10 mx-auto flex w-full max-w-[1640px] flex-1 flex-col justify-center px-10 py-20 sm:px-16 lg:px-20"
          style={{ opacity: heroOpacity }}
        >
          <Reveal>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">From orbit to the field</p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.06] tracking-[-0.04em] text-white drop-shadow-sm sm:text-5xl lg:text-[3.75rem]">
              Turn wetland observations into accountable action.
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/78 sm:text-base">
              TerraLink connects satellite alerts, review decisions, field tasks, costs and reports in one workspace for teams protecting ponds and wetlands in Bangladesh.
            </p>
          </Reveal>
          <Reveal delay={270}>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <span className="size-1.5 animate-pulse rounded-full bg-cyan-200" /> Sentinel-2 · 5-day revisit
              </span>
              <span className="rounded-full border border-white/22 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">5 Dhaka water bodies</span>
              <span className="rounded-full border border-white/22 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">Community photo reports</span>
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
              <Link
                to="/explore"
                className="inline-flex h-12 items-center px-2 text-[15px] font-semibold text-white/90 underline-offset-4 transition hover:text-white hover:underline"
              >
                Explore the map
              </Link>
              <Link
                to="/report"
                className="inline-flex h-12 items-center gap-2 px-2 text-[15px] font-semibold text-white/90 underline-offset-4 transition hover:text-white hover:underline"
              >
                <Camera size={17} /> Report a problem
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-white/35"><ChevronDown size={18} /></div>
      </section>

      {/* Satellite monitoring story: the only white section between hero and workspace */}
      <section id="satellite" className="relative overflow-hidden bg-white md:min-h-[700px]">
        <div className="pointer-events-none absolute -left-28 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 md:block">
          <Suspense fallback={null}>
            <OrbitScene />
          </Suspense>
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-20 px-10 py-28 sm:px-16 md:min-h-[700px] md:flex-row md:gap-16 md:py-24 lg:px-20">
          <Reveal className="relative shrink-0">
            <div className="relative size-52 md:size-60">
              <span aria-hidden="true" className="absolute -left-3 -top-3 size-7 rounded-tl-xl border-l-2 border-t-2 border-brand-300" />
              <span aria-hidden="true" className="absolute -right-3 -top-3 size-7 rounded-tr-xl border-r-2 border-t-2 border-brand-300" />
              <span aria-hidden="true" className="absolute -bottom-3 -left-3 size-7 rounded-bl-xl border-b-2 border-l-2 border-brand-300" />
              <span aria-hidden="true" className="absolute -bottom-3 -right-3 size-7 rounded-br-xl border-b-2 border-r-2 border-brand-300" />
              <div aria-hidden="true" className="absolute -inset-5 animate-[spin-slow_44s_linear_infinite] rounded-full border border-dashed border-slate-200" />
              <div className="absolute inset-0 rounded-full border border-cyan-200/80" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin-slow_28s_linear_infinite]">
                <circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(6,182,212,0.9)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="230 775" />
              </svg>
              <div className="absolute inset-0 animate-[spin-slow_16s_linear_infinite_reverse]">
                <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              </div>
              <div className="absolute inset-[7px] overflow-hidden rounded-full">
                <div aria-hidden="true" className="absolute inset-0 animate-[spin-slow_7s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.30)_55deg,transparent_100deg)]" />
              </div>
              <img src={HERO_SATELLITE} alt="Satellite view of Hatirjheel Lake in Dhaka" className="absolute inset-[7px] size-[calc(100%-14px)] rounded-full object-cover" onError={(event) => { event.currentTarget.src = pondAfter }} />
              <div className="absolute -bottom-8 -right-4 z-10 w-48 rounded-xl border border-slate-200 bg-white p-3.5 shadow-pop md:-right-8">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Flagged for human review
                </p>
                <p className="mt-1 text-[10px] text-slate-400">A signal to investigate, not proof</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140} className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><span className="size-1.5 rounded-full bg-cyan-500" /> Satellite view · Hatirjheel Lake, Dhaka</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Orbit watches the water. The team acts on it.</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-500">
              A satellite comparison or a photo from a resident becomes a reviewed decision, an assigned field visit and a documented cost — in one workspace.
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>23.8° N, 90.4° E · Dhaka</span>
              <span>Sentinel-2 · 10 m resolution</span>
              <span>Dated Sentinel-2 scenes</span>
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-600">
              <Waves size={16} className="text-slate-400" /> <span>Report or signal → Review → Task → Cost → Report</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Features, shown one by one */}
      <FeatureShowcase />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-800">
        <div className="mx-auto grid w-full max-w-[1640px] gap-10 px-10 py-14 sm:px-16 md:grid-cols-[1.2fr_1fr_1fr] lg:px-20">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
              A wetland monitoring and response workspace for NGO project teams and communities in Bangladesh.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {FOOTER_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Developer</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2.5"><User size={15} className="shrink-0 text-slate-400" /> Afrin Jahan Era</li>
              <li className="flex items-center gap-2.5"><Mail size={15} className="shrink-0 text-slate-400" /> afrinera@iut-dhaka.edu</li>
              <li className="flex items-center gap-2.5"><Phone size={15} className="shrink-0 text-slate-400" /> 01308453214</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="mx-auto flex w-full max-w-[1640px] flex-col gap-1 px-10 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-16 lg:px-20">
            <span>TerraLink · Interactive prototype with sample data</span>
            <span>Islamic University of Technology, Dhaka</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
