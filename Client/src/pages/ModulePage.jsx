import {
  ArrowRight,
  BotMessageSquare,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  MapPinned,
  MessageCircle,
  PlugZap,
  Satellite,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useApp } from '../hooks/useApp'

const modules = {
  map: { eyebrow: 'Monitoring', title: 'Wetland map', description: 'Explore five selected ponds and wetlands, filter by review status, and open the correct site record.', icon: MapPinned, next: '/sites/pond-a', nextLabel: 'Preview Pond A', features: ['Interactive site markers', 'Search and status filters', 'Map attribution'] },
  analysis: { eyebrow: 'Evidence', title: 'Site details & change analysis', description: 'Compare selected satellite dates, examine visible water-area estimates, and record a cautious review decision.', icon: Satellite, next: '/tasks', nextLabel: 'Continue to tasks', features: ['Before and after imagery', 'Coverage and quality context', 'Review task entry point'] },
  tasks: { eyebrow: 'Operations', title: 'Review & tasks', description: 'Move observations through review, assign accountable owners, set deadlines, and record progress notes.', icon: ClipboardCheck, next: '/team', nextLabel: 'View project team', features: ['Review queue and filters', 'Four-stage task workflow', 'Comments and activity history'] },
  team: { eyebrow: 'People', title: 'Team', description: 'See who is responsible for each task, their role, availability, and current workload.', icon: Users, next: '/budget', nextLabel: 'Open costs', features: ['Member assignments', 'Workload overview', 'Contact details'] },
  budget: { eyebrow: 'Finance', title: 'Budget & costs', description: 'Keep planned and actual spending linked to each site and task, with clear variance warnings.', icon: ChartNoAxesCombined, next: '/reports', nextLabel: 'Build a report', features: ['Planned vs. actual', 'Expense history', 'Budget alerts'] },
  reports: { eyebrow: 'Accountability', title: 'Reports', description: 'Assemble evidence, decisions, task progress, and expenses into a clear printable record.', icon: FileText, next: '/assistant', nextLabel: 'Ask the assistant', features: ['Site and date filters', 'Current-state preview', 'Print-ready layout'] },
  assistant: { eyebrow: 'Guidance', title: 'Bangla assistant', description: 'Ask preset questions in Bangla and receive contextual answers grounded in the displayed project records.', icon: BotMessageSquare, next: '/integrations', nextLabel: 'Manage integrations', features: ['Suggested questions', 'Record citations', 'Insufficient-data response'] },
  integrations: { eyebrow: 'Automation', title: 'Integrations', description: 'Connect project events to email, calendar reminders, and WhatsApp click-to-chat actions.', icon: PlugZap, next: '/dashboard', nextLabel: 'Return to dashboard', features: ['EmailJS delivery', 'Google Calendar events', 'WhatsApp click-to-chat'] },
}

export function ModulePage({ type }) {
  const { role } = useApp()
  const module = modules[type]
  const Icon = module.icon
  const nextPath = type === 'assistant' && role.id !== 'manager' ? '/dashboard' : module.next
  const nextLabel = type === 'assistant' && role.id !== 'manager' ? 'Return to dashboard' : module.nextLabel

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{module.eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{module.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{module.description}</p></div>
        <Badge tone="brand">Foundation ready</Badge>
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="grid min-h-[440px] lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="relative flex items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50/70 p-8 lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(#b0e4e2_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="relative flex max-w-md flex-col items-center text-center">
              <span className="grid size-20 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-card"><Icon size={34} strokeWidth={1.6} /></span>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">{module.title} workspace</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">The reusable navigation and responsive page foundation are complete. Functional records and interactions will be connected in their scheduled phase.</p>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Planned capabilities</p>
              <ul className="mt-5 space-y-4">
                {module.features.map((feature, index) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-700"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{index + 1}</span>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="mt-10 border-t border-slate-100 pt-5">
              {type === 'integrations' && (
                <div className="mb-5 flex items-center gap-3 text-xs text-slate-500"><span className="flex -space-x-1.5"><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-slate-100 text-slate-600"><MessageCircle size={13} /></span><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-slate-200 text-slate-600"><CalendarDays size={13} /></span></span>Real platform actions, with safe fallbacks</div>
              )}
              <Button as={Link} to={nextPath} variant="secondary" className="w-full">{nextLabel} <ArrowRight size={16} /></Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
