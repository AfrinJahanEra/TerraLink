import { AlertTriangle, CheckCircle2, FileText, MapPin } from 'lucide-react'
import { TASK_STATUS } from '../../constants/status'
import { formatBdt } from '../../utils/currency'
import { VERDICT } from '../../constants/observations'
import { formatAcquired, formatHa, formatPercent, formatSignedHa } from '../../utils/observations'
import { PhotoImage } from '../community/PhotoImage'
import { REPORT_CATEGORIES, REPORT_STATUS } from '../../constants/reports'
import { formatReportDate } from '../../utils/report'
import { buildReportTables } from '../../utils/reportDocument'
import { Badge } from '../ui/Badge'

function SectionTitle({ number, children }) {
  return <h3 className="mb-2.5 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900"><span className="grid size-6 place-items-center rounded-full bg-slate-800 text-[10px] text-white">{number}</span>{children}</h3>
}

function EmptyRow({ colSpan, children }) {
  return <tr><td colSpan={colSpan} className="px-4 py-5 text-center text-xs text-slate-400">{children}</td></tr>
}

export function ReportPreview({ report }) {
  const scopeLabel = report.siteId === 'all' ? 'All monitored wetlands' : report.sites[0]?.name
  const { figures } = buildReportTables(report)
  const single = report.observations.length === 1

  return (
    <article id="report-preview" className="mx-auto max-w-[980px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <header className="bg-brand-800 px-6 py-6 text-white sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/15 text-white"><FileText size={20} /></span><div><p className="text-base font-bold tracking-tight">TerraLink</p><p className="text-[10px] uppercase tracking-[0.15em] text-brand-200">Wetland monitoring workspace</p></div></div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">Sample data</span>
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-200">Monitoring report</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Wetland observation and response summary</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-brand-100"><MapPin size={15} />{scopeLabel}</p>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/20 pt-3 text-xs"><div><dt className="text-brand-200">Reporting period</dt><dd className="mt-0.5 font-semibold">{formatReportDate(report.from)} – {formatReportDate(report.to)}</dd></div><div><dt className="text-brand-200">Generated</dt><dd className="mt-0.5 font-semibold">{formatReportDate(report.generatedAt)}</dd></div><div><dt className="text-brand-200">Prepared for</dt><dd className="mt-0.5 font-semibold">Programme review</dd></div></dl>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 [&>*]:border-b [&>*]:border-r [&>*]:border-slate-200 max-sm:[&>*:nth-child(2n)]:border-r-0 sm:[&>*:nth-child(4n)]:border-r-0">
        {figures.map(([label, value]) => <div key={label} className="bg-white px-5 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p><p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p></div>)}
      </section>

      <div className="space-y-7 px-6 py-6 sm:px-10">
        <section>
          <SectionTitle number="1">Water body summary</SectionTitle>
          <p className="mb-3 text-xs leading-5 text-slate-500">This report reflects the latest browser-saved workspace state for {report.observations.length} selected {report.observations.length === 1 ? 'site' : 'sites'}.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2.5">Site</th><th className="px-3 py-2.5">Mapped area</th><th className="px-3 py-2.5">Water-area change</th><th className="px-3 py-2.5">Community reports</th><th className="px-3 py-2.5">Current status</th></tr></thead><tbody className="divide-y divide-slate-100">{report.observations.map((item) => <tr key={item.id}><td className="px-3 py-2 font-semibold text-slate-800">{item.name}<span className="block text-[10px] font-normal text-slate-400">{item.location}</span></td><td className="px-3 py-2 text-slate-600">{item.area}</td><td className="px-3 py-2 text-slate-600">{item.measured ? (item.measured.result.verdict === 'not_reliable' ? 'Not reliable' : `${formatSignedHa(item.measured.result.deltaM2)} (${formatPercent(item.measured.result.percent)})`) : 'Not yet measured'}</td><td className="px-3 py-2 text-slate-600">{item.reports.length}</td><td className="px-3 py-2"><Badge tone={item.status === 'confirmed' ? 'rose' : item.status === 'no_change' ? 'emerald' : 'slate'}>{item.statusLabel}</Badge></td></tr>)}</tbody></table></div>
        </section>

        <section>
          <SectionTitle number="2">Satellite imagery</SectionTitle>
          <div className={single ? 'grid gap-5' : 'grid gap-x-6 gap-y-5 md:grid-cols-2'}>{report.observations.map((item) => <div key={item.id} className={item.measured ? 'md:col-span-2' : 'md:last:odd:col-span-2'}><div className="mb-2 flex items-start justify-between gap-3"><div><h4 className="text-sm font-semibold text-slate-900">{item.name}, {item.location}</h4><p className="mt-0.5 text-[10px] text-slate-400">{item.measured ? `${VERDICT[item.measured.result.verdict].label}. Sentinel-2, NDWI inside the mapped outline.` : 'Current Esri World Imagery view. No dated comparison has been saved.'}</p></div><span className="text-[10px] font-medium text-slate-500">{item.measured ? `Uncertainty ± ${formatHa(item.measured.result.uncertaintyM2)}` : 'Not yet measured'}</span></div>{item.measured ? <div className="grid grid-cols-2 gap-3">{[['Earlier', item.measured.earlier], ['Later', item.measured.later]].map(([label, observation]) => <figure key={label}><div className="h-40 overflow-hidden rounded-lg bg-slate-100"><PhotoImage photoId={observation.imageKeys.rgb} alt={`${item.name}, ${label.toLowerCase()} image`} /></div><figcaption className="mt-1.5 text-[10px] text-slate-500">{label} · {formatAcquired(observation.acquiredAt).date} · water {formatHa(observation.waterAreaM2)} · {observation.sceneId}</figcaption></figure>)}</div> : <img src={item.image} alt={`${item.name} satellite view`} className={`${single ? 'h-52' : 'h-40'} w-full rounded-lg object-cover`} />}</div>)}</div>
        </section>

        <section>
          <SectionTitle number="3">Decision and explanation</SectionTitle>
          <div className={`border-y border-slate-100 ${single ? '' : 'md:grid md:grid-cols-2 md:gap-x-8'}`}>{report.observations.map((item) => <div key={item.id} className="border-b border-slate-100 py-3 last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-semibold text-slate-800">{item.name}</h4><span className="text-[10px] font-semibold text-slate-500">{item.decision ? item.statusLabel : 'Decision pending'}</span></div><p className="mt-2 text-xs leading-5 text-slate-600">{item.decision?.note || item.reviewNote}</p><p className="mt-2 text-[10px] text-slate-400">{item.decision ? `Recorded by ${item.decision.decidedBy} on ${item.decision.displayDate}` : 'No manager decision has been recorded for this water body.'}</p></div>)}</div>
        </section>

        <section>
          <SectionTitle number="4">Community reports</SectionTitle>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2.5">Report</th><th className="px-3 py-2.5">Water body</th><th className="px-3 py-2.5">Problem</th><th className="px-3 py-2.5">Observed</th><th className="px-3 py-2.5">Review status</th></tr></thead><tbody className="divide-y divide-slate-100">{report.reports.map((item) => <tr key={item.id}><td className="px-3 py-2 font-semibold text-slate-800">{item.id}<span className="mt-0.5 block max-w-[240px] truncate text-[10px] font-normal text-slate-400">{item.description}</span></td><td className="px-3 py-2 text-slate-600">{report.sites.find((site) => site.id === item.siteId)?.name}</td><td className="px-3 py-2 text-slate-600">{REPORT_CATEGORIES[item.category].label}</td><td className="px-3 py-2 text-slate-600">{formatReportDate(item.observedAt)}</td><td className="px-3 py-2 text-slate-600">{REPORT_STATUS[item.status].label}</td></tr>)}{!report.reports.length && <EmptyRow colSpan={5}>No community reports in this period.</EmptyRow>}</tbody></table></div>
          <p className="mt-3 text-[10px] leading-4 text-slate-400">A verified report means its evidence was reviewed. It does not by itself establish the condition of the whole water body.</p>
        </section>

        <section>
          <SectionTitle number="5">Tasks in reporting period</SectionTitle>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2.5">Task</th><th className="px-3 py-2.5">Site</th><th className="px-3 py-2.5">Assignee</th><th className="px-3 py-2.5">Due</th><th className="px-3 py-2.5">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{report.tasks.map((task) => <tr key={task.id}><td className="px-3 py-2"><span className="font-semibold text-slate-800">{task.id}</span><span className="mt-0.5 block text-[10px] text-slate-500">{task.title}</span></td><td className="px-3 py-2 text-slate-600">{task.site}</td><td className="px-3 py-2 text-slate-600">{task.assignee}</td><td className="px-3 py-2 text-slate-600">{formatReportDate(task.dueDate)}</td><td className="px-3 py-2 text-slate-600">{TASK_STATUS[task.status]?.label ?? 'Unknown'}</td></tr>)}{!report.tasks.length && <EmptyRow colSpan={5}>No task deadlines fall inside this date range.</EmptyRow>}</tbody></table></div>
        </section>

        <section>
          <SectionTitle number="6">Costs and variance</SectionTitle>
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2.5">Site</th><th className="px-3 py-2.5 text-right">Planned</th><th className="px-3 py-2.5 text-right">Actual</th><th className="px-3 py-2.5 text-right">Difference</th></tr></thead><tbody className="divide-y divide-slate-100">{report.budgetRows.map((row) => <tr key={row.id} className={row.overBudget ? 'bg-slate-50' : ''}><td className="px-3 py-2 font-semibold text-slate-800">{row.name}</td><td className="px-3 py-2 text-right text-slate-600">{formatBdt(row.planned)}</td><td className="px-3 py-2 text-right text-slate-600">{formatBdt(row.actual)}</td><td className={`px-3 py-2 text-right font-semibold ${row.remaining < 0 ? 'text-rose-700' : 'text-slate-700'}`}>{formatBdt(row.remaining)}</td></tr>)}</tbody><tfoot><tr className="border-t-2 border-slate-200 font-semibold"><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right">{formatBdt(report.totals.planned)}</td><td className="px-3 py-2 text-right">{formatBdt(report.totals.actual)}</td><td className={`px-3 py-2 text-right ${report.totals.variance < 0 ? 'text-rose-700' : 'text-slate-700'}`}>{formatBdt(report.totals.variance)}</td></tr></tfoot></table></div>
          {report.budgetRows.some((row) => row.overBudget) && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-700"><AlertTriangle size={15} className="text-slate-600" />One or more sites exceeded the planned allocation.</p>}
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div><SectionTitle number="7">Limitations</SectionTitle><ul className="space-y-2 text-xs leading-5 text-slate-600"><li>Water-area change appears only where a saved satellite measurement exists. It is an estimate from 10 m pixels with the stated uncertainty, not a survey.</li><li>Cloud, shadow, seasonality, floating plants, mixed pixels, and 10 m source resolution can affect interpretation.</li><li>A mapped change is a review signal, not proof of encroachment or permanent wetland loss.</li><li>Task and cost totals reflect browser-local records at generation time.</li></ul></div>
          <div><SectionTitle number="8">Sources and attribution</SectionTitle><dl className="space-y-2 text-xs text-slate-600"><div><dt className="font-semibold text-slate-700">Imagery</dt><dd>{report.sources.imagery}</dd></div><div><dt className="font-semibold text-slate-700">Provider</dt><dd>{report.sources.provider}</dd></div><div><dt className="font-semibold text-slate-700">Reference layer</dt><dd>Water-body outlines from OpenStreetMap contributors (community-mapped, unverified).</dd></div><div><dt className="font-semibold text-slate-700">Resolution</dt><dd>{report.sources.resolution}</dd></div></dl></div>
        </section>

        <footer className="flex items-start gap-3 border-t border-slate-200 pt-4"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-slate-500" /><p className="text-[10px] leading-4 text-slate-500"><strong className="text-slate-700">Sample-data disclaimer.</strong> TerraLink is a frontend demonstration. Site classifications, decisions, tasks, people, contacts, and costs are illustrative. Water-body outlines and satellite imagery are real third-party data and keep their provider attribution. Community reports are stored in this browser only.</p></footer>
      </div>
    </article>
  )
}
