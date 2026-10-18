/**
 * TerraLink Copilot: answers free questions about the workspace from live data. Questions can be typed in English,
 * Bangla or Banglish; answers are in English. It runs entirely in the browser, with no external AI.
 *
 * Access follows the role. The project manager gets everything, including budgets, all expenses, team workload and
 * who reported what. A field coordinator gets public facts about every lake plus their own tasks, budget and expenses;
 * questions about confidential data are declined with a reason.
 */
import { isTaskClosed } from '../constants/status'
import { REFERENCE_PHOTOS } from '../data/referencePhotos'
import { formatBdt } from './currency'
import { formatSignedHa } from './observations'
import { daysUntilDue, isTaskOverdue } from './tasks'

const date = (value) => (value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' }).format(new Date(value.length === 10 ? `${value}T12:00:00+06:00` : value)) : '')
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

const SITE_STATUS_TEXT = {
  needs_review: 'Needs review', reported_issue: 'Issue reported', confirmed: 'Confirmed for follow-up',
  inconclusive: 'Inconclusive', no_change: 'No change', insufficient_data: 'Insufficient data',
}
const TASK_STATUS_TEXT = { open: 'not started', in_progress: 'in progress', blocked: 'blocked', awaiting_verification: 'awaiting verification', completed: 'completed', cancelled: 'cancelled' }
const REPORT_CATEGORY_TEXT = { waste_dumping: 'Waste dumping', water_pollution: 'Water pollution', encroachment: 'Possible encroachment', water_level: 'Water level', other: 'Other' }
const REPORT_STATUS_TEXT = { pending: 'pending', under_review: 'under review', verified: 'verified', rejected: 'rejected' }
const VERDICT_TEXT = { decrease: 'water area decreased', increase: 'water area increased', within_uncertainty: 'no measurable change', not_reliable: 'no reliable measurement' }

/** Lake names and the ways people write them, including Bangla script. Custom sites match by their own names. */
const SITE_ALIASES = {
  'gulshan-baridhara-lake': ['gulshan', 'গুলশান', 'baridhara', 'বারিধারা'],
  hatirjheel: ['hatirjheel', 'hatir jheel', 'hatirjhil', 'হাতিরঝিল', 'হাতির ঝিল'],
  'dhanmondi-lake': ['dhanmondi', 'ধানমন্ডি', 'ধানমণ্ডি'],
  'ramna-lake': ['ramna', 'রমনা'],
  'gol-talab': ['gol talab', 'goltalab', 'গোল তালাব', 'গোলতালাব'],
}

/** Words that point to each kind of question, in English, Bangla and Banglish. Order breaks ties. */
const INTENTS = [
  ['help', ['help', 'what can you', 'what do you know', 'সাহায্য', 'কী পারো', 'কি পারো', 'ki korte paro']],
  ['reporter', ['reporter', 'who reported', 'phone', 'contact', 'email', 'number', 'কে রিপোর্ট', 'রিপোর্টকারী', 'ফোন', 'যোগাযোগ']],
  ['team', ['team', 'workload', 'who is free', 'available', 'staff', 'coordinators', 'টিম', 'কর্মী', 'কাজের চাপ']],
  ['approvals', ['approval', 'approve', 'extra budget', 'request', 'অনুমোদন', 'অতিরিক্ত', 'onumodon']],
  ['budget', ['budget', 'cost', 'spent', 'spend', 'money', 'variance', 'allocation', 'expense', 'taka', 'বাজেট', 'খরচ', 'টাকা', 'khoroch']],
  ['my_tasks', ['my task', 'my work', 'assigned to me', 'আমার কাজ', 'amar kaj']],
  ['overdue', ['overdue', ' late ', 'past due', 'missed', 'দেরি', 'মেয়াদ', 'deri']],
  // Time words only count as whole words, so "today's summary" is not read as "due today".
  ['due', ['deadline', ' due ', ' today ', ' tomorrow ', 'this week', 'next week', ' আজ ', ' কাল ', 'এই সপ্তাহ', 'শেষ তারিখ']],
  ['waste', ['waste', 'dump', 'garbage', 'plastic', 'litter', 'trash', ' ai ', 'ময়লা', 'বর্জ্য', 'moyla']],
  ['limitations', ['limitation', 'accuracy', 'accurate', 'reliable', 'trust', 'সীমাবদ্ধতা']],
  ['satellite', ['satellite', 'water area', 'measurement', 'measured', 'hectare', 'ndwi', 'sentinel', 'shrink', 'স্যাটেলাইট', 'আয়তন']],
  ['decision', ['decision', 'decided', 'সিদ্ধান্ত']],
  ['meeting', ['meeting', 'মিটিং']],
  ['reports', ['report', 'complaint', 'community', 'রিপোর্ট', 'অভিযোগ']],
  ['tasks', ['task', 'work', 'pending', ' open ', 'in progress', 'blocked', 'কাজ', 'বাকি', 'kaj']],
  ['summary', ['summary', 'overview', 'briefing', 'all lakes', 'everything', 'সারসংক্ষেপ']],
  ['status', ['status', 'condition', 'how is', "how's", 'situation', 'অবস্থা', 'কেমন', 'obostha', 'kemon']],
]

const PROGRAMME_WORDS = ['total', 'overall', 'programme', 'program', 'all lakes', 'site budget', 'lake budget', 'মোট', 'প্রকল্প']

/** Words that make a question a follow-up about the lake discussed just before. */
const FOLLOW_UP_WORDS = [' and ', ' also ', ' there ', 'this lake', 'that lake', ' same ', ' its ', ' আর ', 'এখানে', 'এই লেক', ' ar ']

export const ACCESS = {
  confidential: { label: 'Confidential · manager only' },
  personal: { label: 'Your own data' },
  public: { label: 'Public lake information' },
  denied: { label: 'Not permitted' },
}

const normalize = (text) => ` ${String(text).toLowerCase().replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit)).replace(/[?？।!,.]/g, ' ').replace(/\s+/g, ' ').trim()} `

function findSite(text, sites) {
  for (const site of sites) {
    const names = [...(SITE_ALIASES[site.id] ?? []), site.name.toLowerCase(), site.nameBn].filter(Boolean)
    if (names.some((name) => text.includes(name.toLowerCase()))) return site
  }
  return null
}

function detectIntent(text) {
  let best = null
  for (const [id, words] of INTENTS) {
    const score = words.filter((word) => text.includes(word)).length
    if (score && (!best || score > best.score)) best = { id, score }
  }
  return best?.id ?? null
}

const deny = (what, why = 'Only the project manager can see it.') => ({
  title: 'You do not have access to this',
  lines: [`${what} is confidential. ${why}`, 'You can ask about your own tasks, your task budgets and expenses, and the status of any lake.'],
  access: 'denied',
  sources: ['Access policy'],
  followUps: ['What are my tasks?', 'How much budget do I have left?', 'How is Dhanmondi Lake?'],
})

/* Photos shown with an answer: { photoId } for stored evidence, { url } for bundled images, plus a caption. */
function reportPhoto(report) {
  const marked = report.aiAnalysis?.photos?.find((photo) => photo.annotatedPhotoId)
  const id = marked?.annotatedPhotoId ?? report.photos?.[0]?.id
  return id ? { photoId: id, caption: `${report.id} · ${marked ? 'AI-marked waste' : REPORT_CATEGORY_TEXT[report.category]}` } : null
}

function sitePhotos(ctx, site) {
  const photos = []
  const reference = REFERENCE_PHOTOS[site.id]
  if (reference) photos.push({ url: reference.url, caption: `${site.name} · baseline photo` })
  else if (site.baselinePhotoId) photos.push({ photoId: site.baselinePhotoId, caption: `${site.name} · baseline photo` })
  const latest = ctx.reports.filter((report) => report.siteId === site.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(reportPhoto).find(Boolean)
  if (latest) photos.push(latest)
  if (site.measured?.later?.imageKeys?.rgb) photos.push({ photoId: site.measured.later.imageKeys.rgb, caption: `Satellite · ${date(site.measured.later.acquiredAt)}` })
  return photos.slice(0, 3)
}

const taskLine = (task, { withAssignee }) => `${task.id} · ${task.title} — ${TASK_STATUS_TEXT[task.status] ?? task.status}, due ${date(task.dueDate)}${withAssignee ? `, ${task.assignee}` : ''}${isTaskOverdue(task) ? ' (overdue)' : ''}`

/* ---------------------------------------------------------------------------------------------------------------- */

function status(ctx, site) {
  if (!site) return summary(ctx)
  const reports = ctx.reports.filter((report) => report.siteId === site.id)
  const open = ctx.tasks.filter((task) => task.siteId === site.id && !isTaskClosed(task))
  const measured = site.measured
  return {
    title: `${site.name}: ${SITE_STATUS_TEXT[site.status] ?? site.status}`,
    lines: [site.reviewNote ? `Latest note: ${site.reviewNote}` : ''].filter(Boolean),
    bullets: [
      `Location: ${site.location} · mapped area ${site.areaHa.toFixed(1)} ha`,
      `Open community reports: ${site.openReports} (of ${reports.length})`,
      measured ? `Satellite: ${VERDICT_TEXT[measured.result.verdict]} (${formatSignedHa(measured.result.deltaM2)})` : 'Satellite: no measurement saved yet',
      `${ctx.isManager ? 'Open tasks' : 'Your open tasks'}: ${open.length}`,
      ctx.decisions[site.id] ? `Manager decision: ${SITE_STATUS_TEXT[ctx.decisions[site.id].status]}` : 'No manager decision recorded yet',
    ],
    photos: sitePhotos(ctx, site),
    access: 'public',
    sources: ['Site record', 'Community reports', measured ? 'Sentinel-2 measurement' : null].filter(Boolean),
    followUps: [`What work is open at ${site.name}?`, `Any waste reports at ${site.name}?`, `Satellite result for ${site.name}?`],
  }
}

function summary(ctx) {
  const attention = ctx.sites.filter((site) => ['needs_review', 'reported_issue', 'confirmed'].includes(site.status))
  const open = ctx.tasks.filter((task) => !isTaskClosed(task))
  const overdue = open.filter(isTaskOverdue)
  return {
    title: ctx.isManager ? "Today's summary" : 'Your summary',
    lines: [ctx.isManager
      ? `${attention.length} of ${ctx.sites.length} water bodies need attention. ${plural(open.length, 'task')} open, ${overdue.length} overdue.`
      : `You have ${plural(open.length, 'open task')}, ${overdue.length} overdue. Status of each lake:`],
    bullets: ctx.sites.map((site) => `${site.name} — ${SITE_STATUS_TEXT[site.status]}${site.openReports ? `, ${plural(site.openReports, 'open report')}` : ''}`),
    photos: (attention.length ? attention : ctx.sites).slice(0, 3).map((site) => sitePhotos(ctx, site)[0]).filter(Boolean),
    access: ctx.isManager ? 'confidential' : 'public',
    sources: ['Site register', 'Task register'],
    followUps: ctx.isManager ? ['Which tasks are overdue?', 'What is waiting for approval?', 'How is the overall budget?'] : ['What are my tasks?', 'What are my deadlines this week?', 'How much budget do I have left?'],
  }
}

function taskList(ctx, site, { onlyOverdue = false, onlyMine = false } = {}) {
  let tasks = ctx.tasks.filter((task) => !isTaskClosed(task))
  if (site) tasks = tasks.filter((task) => task.siteId === site.id)
  if (onlyOverdue) tasks = tasks.filter(isTaskOverdue)
  const where = site ? ` at ${site.name}` : ''
  const whose = ctx.isManager && !onlyMine ? '' : 'your '
  const kind = onlyOverdue ? 'overdue' : 'open'
  if (!tasks.length) {
    return {
      title: `No ${kind} ${whose}tasks${where}`,
      lines: [onlyOverdue ? 'Everything is on schedule.' : 'New work will appear here when it is assigned.'],
      access: ctx.isManager ? 'confidential' : 'personal',
      sources: ['Task register'],
      followUps: ctx.isManager ? ["Give me today's summary", 'How is the team workload?'] : ['How much budget do I have left?', 'How is Dhanmondi Lake?'],
    }
  }
  return {
    title: whose ? `You have ${plural(tasks.length, `${kind} task`)}${where}` : capitalize(`${plural(tasks.length, `${kind} task`)}${where}`),
    bullets: [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((task) => taskLine(task, { withAssignee: ctx.isManager })),
    lines: onlyOverdue && ctx.isManager ? ['You can email the coordinator a reminder from the task.'] : [],
    access: ctx.isManager ? 'confidential' : 'personal',
    sources: tasks.slice(0, 4).map((task) => `Task ${task.id}`),
    followUps: [`Show details of ${tasks[0].id}`, onlyOverdue ? 'What is due this week?' : 'Which tasks are overdue?'],
  }
}

function dueSoon(ctx, text) {
  const horizon = [' today ', ' আজ '].some((word) => text.includes(word)) ? 0 : [' tomorrow ', ' কাল '].some((word) => text.includes(word)) ? 1 : 7
  const tasks = ctx.tasks.filter((task) => !isTaskClosed(task) && daysUntilDue(task.dueDate) >= 0 && daysUntilDue(task.dueDate) <= horizon)
  const when = horizon === 0 ? 'today' : horizon === 1 ? 'today or tomorrow' : 'in the next 7 days'
  return {
    title: tasks.length ? `${plural(tasks.length, 'task')} due ${when}` : `Nothing due ${when}`,
    bullets: tasks.map((task) => taskLine(task, { withAssignee: ctx.isManager })),
    access: ctx.isManager ? 'confidential' : 'personal',
    sources: ['Task register'],
    followUps: ['Which tasks are overdue?', ctx.isManager ? 'How is the team workload?' : 'What are my tasks?'],
  }
}

function taskDetail(ctx, id) {
  const task = ctx.tasks.find((item) => item.id.toLowerCase() === id.toLowerCase())
  if (!task) return ctx.isManager ? { title: `No task called ${id}`, lines: ['Check the ID, for example TL-105.'], access: 'public', sources: ['Task register'] } : deny(`Task ${id}`, 'It is not assigned to you.')
  const latest = task.submissions?.at(-1)
  const source = ctx.reports.find((report) => report.id === task.reportId)
  const before = source ? reportPhoto(source) : null
  const after = latest?.photos?.[0] ? { photoId: latest.photos[0].id, caption: `${task.id} · after the work` } : null
  const aiClean = latest?.aiPrecheck?.length ? latest.aiPrecheck.every((item) => item.waste === null || item.waste < 0.55) : null
  return {
    title: `${task.id} · ${task.title}`,
    lines: [task.description],
    bullets: [
      `Status: ${TASK_STATUS_TEXT[task.status]}${task.status === 'blocked' && task.blockedReason ? ` (${task.blockedReason})` : ''}`,
      `Lake: ${task.site} · due ${date(task.dueDate)}${isTaskOverdue(task) ? ' · overdue' : ''}`,
      ctx.isManager ? `Assigned to ${task.assignee} · ${task.priority} priority` : `${task.priority} priority`,
      `Budget ${formatBdt(task.budget)} · spent ${formatBdt(task.actualCost)} · left ${formatBdt(task.remainingBudget)}`,
      latest ? `Last submission ${date(latest.submittedAt)}${aiClean === null ? '' : aiClean ? ' · AI: photos look clean' : ' · AI: waste still visible'}` : 'No completion evidence submitted yet',
    ],
    photos: [before && { ...before, caption: `Before · ${before.caption}` }, after && { ...after, caption: `After · ${after.caption}` }].filter(Boolean),
    access: ctx.isManager ? 'confidential' : 'personal',
    sources: [`Task ${task.id}`],
    followUps: [`How is ${task.site}?`, ctx.isManager ? 'What is waiting for approval?' : 'How much budget do I have left?'],
  }
}

function reports(ctx, site, { wasteOnly = false } = {}) {
  let list = ctx.reports.filter((report) => !site || report.siteId === site.id)
  if (wasteOnly) list = list.filter((report) => report.aiAnalysis?.hasWaste || report.category === 'waste_dumping')
  const waiting = list.filter((report) => ['pending', 'under_review'].includes(report.status))
  const where = site ? ` at ${site.name}` : ''
  return {
    title: wasteOnly ? `${plural(list.length, 'waste report')}${where}` : `${plural(list.length, 'community report')}${where}, ${waiting.length} awaiting review`,
    bullets: list.slice(0, 8).map((report) => {
      const ai = report.aiAnalysis?.hasWaste ? ` · AI: waste ${Math.round(report.aiAnalysis.confidence * 100)}%, ${report.aiAnalysis.severity} severity` : ''
      const who = ctx.isManager && report.reporter?.name ? ` · ${report.reporter.name}` : ''
      return `${report.id} · ${REPORT_CATEGORY_TEXT[report.category]} — ${REPORT_STATUS_TEXT[report.status]}, seen ${date(report.observedAt)}${ai}${who}`
    }),
    lines: list.length ? (ctx.isManager ? [] : ["Reporters' identities are kept private."]) : ['No reports yet.'],
    photos: list.map(reportPhoto).filter(Boolean).slice(0, 3),
    access: ctx.isManager ? 'confidential' : 'public',
    sources: ['Community reports', wasteOnly ? 'AI waste detection' : null].filter(Boolean),
    followUps: [waiting[0] ? `Show details of ${waiting[0].id}` : "Give me today's summary", ctx.isManager ? 'Who reported these?' : 'What are my tasks?'],
  }
}

function reportDetail(ctx, id) {
  const report = ctx.reports.find((item) => item.id.toLowerCase() === id.toLowerCase())
  if (!report) return { title: `No report called ${id}`, lines: ['Check the ID, for example RPT-004.'], access: 'public', sources: ['Community reports'] }
  const site = ctx.sites.find((item) => item.id === report.siteId)
  const ai = report.aiAnalysis
  const marked = (ai?.photos ?? []).filter((photo) => photo.annotatedPhotoId).map((photo) => ({ photoId: photo.annotatedPhotoId, caption: `${report.id} · AI-marked waste` }))
  const originals = (report.photos ?? []).map((photo, index) => ({ photoId: photo.id, caption: `${report.id} · photo ${index + 1}` }))
  return {
    title: `${report.id} · ${REPORT_CATEGORY_TEXT[report.category]}`,
    lines: [report.description],
    bullets: [
      `Lake: ${site?.name ?? 'Other location'} · seen ${date(report.observedAt)}`,
      `Review: ${REPORT_STATUS_TEXT[report.status]}${report.resolved ? ' · resolved' : ''}`,
      ai?.hasWaste ? `AI: ${plural(ai.regions, 'waste area')}, ${ai.severity} severity, ${Math.round(ai.confidence * 100)}% confidence` : 'No AI analysis',
      ...(ctx.isManager ? [`Reporter: ${report.reporter?.name || 'not given'}${report.reporter?.contact ? ` · ${report.reporter.contact}` : ''}${report.reporter?.email ? ` · ${report.reporter.email}` : ''}`] : []),
    ],
    photos: [...marked, ...originals].slice(0, 3),
    access: ctx.isManager ? 'confidential' : 'public',
    sources: [`Report ${report.id}`],
    followUps: [site ? `How is ${site.name}?` : "Give me today's summary"],
  }
}

function satellite(ctx, site) {
  const sites = site ? [site] : ctx.sites
  const measured = sites.filter((item) => item.measured)
  return {
    title: site ? `${site.name}: satellite measurement` : `${plural(measured.length, 'lake')} with a saved satellite measurement`,
    bullets: sites.map((item) => (item.measured
      ? `${item.name} — ${VERDICT_TEXT[item.measured.result.verdict]}, ${formatSignedHa(item.measured.result.deltaM2)} (± ${(item.measured.result.uncertaintyM2 / 10000).toFixed(1)} ha)`
      : `${item.name} — not measured yet${item.areaHa < 1 ? '; under 1 ha, so field evidence is needed' : ''}`)),
    lines: ['Water area comes from 10 m Sentinel-2 images. It shows where to look closer; it is not proof of encroachment or damage.'],
    photos: measured.filter((item) => item.measured.later?.imageKeys?.rgb).slice(0, 3).map((item) => ({ photoId: item.measured.later.imageKeys.rgb, caption: `${item.name} · satellite ${date(item.measured.later.acquiredAt)}` })),
    access: 'public',
    sources: ['Sentinel-2 measurement'],
    followUps: ['What are the limitations of the data?', site ? `How is ${site.name}?` : "Give me today's summary"],
  }
}

function budget(ctx, site, text) {
  if (!ctx.isManager) {
    if (PROGRAMME_WORDS.some((word) => text.includes(word)) || site) return deny('Lake and programme budget')
    const mine = ctx.tasks.filter((task) => !isTaskClosed(task))
    const given = mine.reduce((sum, task) => sum + task.budget, 0)
    const spent = mine.reduce((sum, task) => sum + task.actualCost, 0)
    return {
      title: `Your tasks: budget ${formatBdt(given)}, ${formatBdt(given - spent)} left`,
      bullets: mine.map((task) => `${task.id} · budget ${formatBdt(task.budget)}, spent ${formatBdt(task.actualCost)}, left ${formatBdt(task.remainingBudget)}${task.pendingCost ? `, ${formatBdt(task.pendingCost)} awaiting approval` : ''}`),
      lines: ['Expenses within a task budget are accepted at once. If you need more, request extra budget when you add the expense.'],
      access: 'personal',
      sources: ['Task budgets', 'Your expenses'],
      followUps: ['Which of my expenses are waiting for approval?', 'What are my tasks?'],
    }
  }
  const rows = site ? ctx.budgetRows.filter((row) => row.id === site.id) : ctx.budgetRows
  const planned = rows.reduce((sum, row) => sum + row.planned, 0)
  const actual = rows.reduce((sum, row) => sum + row.actual, 0)
  return {
    title: site ? `${site.name}: ${formatBdt(actual)} spent of ${formatBdt(planned)}` : `Programme: ${formatBdt(actual)} spent of ${formatBdt(planned)}, ${formatBdt(planned - actual)} left`,
    bullets: rows.map((row) => `${row.name} — allocated ${formatBdt(row.planned)}, spent ${formatBdt(row.actual)}, ${row.overBudget ? `${formatBdt(-row.remaining)} over budget` : `${formatBdt(row.remaining)} left`}`),
    lines: rows.some((row) => row.overBudget) ? ['Consider a budget review meeting for the lakes over their allocation.'] : [],
    access: 'confidential',
    sources: ['Budget ledger'],
    followUps: ['What is waiting for approval?', 'How is the team workload?'],
  }
}

function approvals(ctx) {
  const waiting = ctx.expenses.filter((expense) => expense.approvalStatus === 'pending')
  const asked = waiting.reduce((sum, expense) => sum + Number(expense.topUp?.amount || 0), 0)
  return {
    title: waiting.length ? `${plural(waiting.length, 'expense')} waiting for approval${asked ? `, ${formatBdt(asked)} extra budget requested` : ''}` : 'Nothing is waiting for approval',
    bullets: waiting.map((expense) => `${expense.id} · ${expense.description} — ${formatBdt(expense.amount)}${expense.taskId ? `, ${expense.taskId}` : ''}${ctx.isManager ? `, ${expense.createdBy}` : ''}${expense.topUp ? ` · extra ${formatBdt(expense.topUp.amount)}: ${expense.topUp.reason}` : ''}`),
    lines: ctx.isManager && waiting.length ? ['Approve or reject them from the task or the Budget ledger.'] : [],
    access: ctx.isManager ? 'confidential' : 'personal',
    sources: ['Expense ledger'],
    followUps: ctx.isManager ? ['How is the overall budget?', 'Which tasks are overdue?'] : ['How much budget do I have left?'],
  }
}

function team(ctx) {
  if (!ctx.isManager) return deny("Other team members' work and workload")
  const coordinators = ctx.teamMembers.filter((member) => member.role === 'Field Coordinator')
  return {
    title: plural(coordinators.length, 'field coordinator'),
    bullets: coordinators.map((member) => {
      const own = ctx.tasks.filter((task) => task.assignee === member.name && !isTaskClosed(task))
      const late = own.filter(isTaskOverdue).length
      return `${member.name} — ${own.length}/${member.capacity} tasks${late ? `, ${late} overdue` : ''}${member.availability === 'leave' ? ' · on leave' : member.availability === 'limited' ? ' · limited availability' : ''}`
    }),
    lines: ['Assign new work to the coordinator with the most free capacity.'],
    access: 'confidential',
    sources: ['Team register', 'Task register'],
    followUps: ['Which tasks are overdue?', "Give me today's summary"],
  }
}

function reporter(ctx, site) {
  if (!ctx.isManager) return deny("A reporter's name and contact details", "To protect citizens' privacy, only the project manager can see them.")
  const list = ctx.reports.filter((report) => !site || report.siteId === site.id)
  return {
    title: `Reporters${site ? ` at ${site.name}` : ''}`,
    bullets: list.slice(0, 10).map((report) => `${report.id} — ${report.reporter?.name || 'name not given'}${report.reporter?.contact ? ` · ${report.reporter.contact}` : ''}${report.reporter?.email ? ` · ${report.reporter.email}` : ''}`),
    lines: ['Confidential: do not share outside the team.'],
    access: 'confidential',
    sources: ['Community reports'],
    followUps: ['Which reports are awaiting review?'],
  }
}

function decision(ctx, site) {
  const sites = site ? [site] : ctx.sites.filter((item) => ctx.decisions[item.id])
  if (!sites.length) return { title: 'No decisions recorded yet', access: 'public', sources: ['Decision register'] }
  return {
    title: site ? `${site.name}: manager decision` : `Decisions recorded for ${plural(sites.length, 'lake')}`,
    bullets: sites.map((item) => {
      const record = ctx.decisions[item.id]
      if (!record) return `${item.name} — no decision yet`
      return `${item.name} — ${SITE_STATUS_TEXT[record.status]}${ctx.isManager && record.note ? `: ${record.note}` : ''}${ctx.isManager ? ` (${record.decidedBy})` : ''}`
    }),
    access: ctx.isManager ? 'confidential' : 'public',
    sources: ['Decision register'],
    followUps: [site ? `How is ${site.name}?` : "Give me today's summary"],
  }
}

function meetings(ctx) {
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = ctx.meetings.filter((meeting) => meeting.status === 'scheduled' && meeting.date >= today).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
  return {
    title: upcoming.length ? plural(upcoming.length, 'upcoming meeting') : 'No upcoming meetings',
    bullets: upcoming.slice(0, 6).map((meeting) => `${meeting.title} — ${date(meeting.date)}, ${meeting.startTime}${meeting.meetUrl ? ' · Google Meet' : ''}`),
    access: ctx.isManager ? 'confidential' : 'personal',
    sources: ['Google Calendar meetings'],
    followUps: ['What is due this week?'],
  }
}

function limitations(site) {
  return {
    title: 'Limitations of the data',
    bullets: [
      'Lake outlines come from OpenStreetMap and are approximate until checked in the field.',
      'Waste is too small to see in 10 m satellite pixels; it is confirmed from citizen photos checked by AI.',
      'Water level changes with the season, so compare two dates from the same time of year.',
      `Satellite measurements are not reliable for water bodies under 1 ha${site?.areaHa < 1 ? ` (${site.name} is one)` : ''}.`,
      'AI results are suggestions; the project manager makes the final decision.',
    ],
    access: 'public',
    sources: ['Method notes'],
    followUps: ['Show the satellite results'],
  }
}

function help(ctx) {
  return {
    title: 'What I can tell you',
    bullets: ctx.isManager
      ? ['Status, reports, satellite results and decisions for any lake', 'All tasks, overdue work and upcoming deadlines', 'Programme and lake budgets, spending and extra-budget requests', 'Team workload and reporter contacts (confidential)', 'Details by ID, such as TL-105 or RPT-004']
      : ['Status, reports and satellite results for any lake', 'Your own tasks, deadlines and overdue work', "Your tasks' budgets, spending and expenses waiting for approval", 'Details of your own tasks by ID, such as TL-105'],
    lines: ['Ask in English, Bangla or Banglish.', ctx.isManager ? '' : "Programme budgets, team data and reporters' identities are confidential and will not be shown."].filter(Boolean),
    access: ctx.isManager ? 'confidential' : 'public',
    sources: ['Copilot guide'],
    followUps: ctx.isManager ? ["Give me today's summary", 'What is waiting for approval?'] : ['What are my tasks?', 'How much budget do I have left?'],
  }
}

/**
 * Answers one question. `memory` carries the lake from the previous question, used when the new one is a follow-up
 * ("and what work is open there?"). Returns { answer, memory }.
 */
export function answerQuestion(question, ctx, memory = {}) {
  const text = normalize(question)
  const taskId = text.match(/\btl-?\s?(\d+)\b/)?.[1]
  const reportId = text.match(/\brpt-?\s?(\d+)\b/)?.[1]
  const named = findSite(text, ctx.sites)
  const followUp = FOLLOW_UP_WORDS.some((word) => text.includes(word))
  const site = named ?? (followUp && memory.siteId ? ctx.sites.find((item) => item.id === memory.siteId) : null)
  const intent = taskId ? 'task_detail' : reportId ? 'report_detail' : detectIntent(text) ?? (named ? 'status' : null)
  const nextMemory = { siteId: site?.id ?? memory.siteId ?? null }
  // Programme-wide questions should not stay pinned to a lake.
  const lake = ['summary', 'team', 'help', 'meeting', 'approvals'].includes(intent) ? null : site

  const answers = {
    help: () => help(ctx),
    summary: () => summary(ctx),
    status: () => status(ctx, lake),
    tasks: () => taskList(ctx, lake),
    my_tasks: () => taskList(ctx, null, { onlyMine: true }),
    overdue: () => taskList(ctx, lake, { onlyOverdue: true }),
    due: () => dueSoon(ctx, text),
    reports: () => reports(ctx, lake),
    waste: () => reports(ctx, lake, { wasteOnly: true }),
    satellite: () => satellite(ctx, lake),
    budget: () => budget(ctx, named, text),
    approvals: () => approvals(ctx),
    team: () => team(ctx),
    reporter: () => reporter(ctx, lake),
    decision: () => decision(ctx, lake),
    meeting: () => meetings(ctx),
    limitations: () => limitations(lake),
    task_detail: () => taskDetail(ctx, `TL-${taskId}`),
    report_detail: () => reportDetail(ctx, `RPT-${reportId.padStart(3, '0')}`),
  }

  const answer = answers[intent]?.() ?? {
    title: "I didn't quite get that",
    lines: ['Try naming a lake, a task or report ID, or a topic such as status, tasks, reports, budget or satellite.'],
    access: 'public',
    sources: [],
    followUps: ctx.isManager ? ["Give me today's summary", 'What can you do?'] : ['What are my tasks?', 'What can you do?'],
  }
  return { answer: { lines: [], bullets: [], followUps: [], photos: [], ...answer, intent: intent ?? 'unknown' }, memory: nextMemory }
}
