import {
  CalendarDays,
  CalendarPlus,
  Check,
  CircleAlert,
  Download,
  ExternalLink,
  KeyRound,
  Mail,
  MessageCircle,
  PlugZap,
  Unplug,
} from 'lucide-react'
import { useState } from 'react'
import { NotificationLog } from '../components/integrations/NotificationLog'
import { ServiceCard } from '../components/integrations/ServiceCard'
import { Button } from '../components/ui/Button'
import { integrationRules } from '../data/integrations'
import { useApp } from '../hooks/useApp'
import {
  connectGoogleCalendar,
  createGoogleCalendarLink,
  disconnectGoogleCalendar,
  downloadDeadlineIcs,
  getGoogleCalendarConfiguration,
} from '../services/calendar'
import { getEmailConfiguration } from '../services/email'
import { normalizeWhatsAppNumber } from '../services/whatsapp'

const services = [
  { id: 'email', name: 'EmailJS', icon: Mail, description: 'Real Gmail delivery for assignments, budget alerts, completions, and report summaries.' },
  { id: 'calendar', name: 'Google Calendar', icon: CalendarDays, description: 'OAuth event creation with a one-day reminder and browser-safe fallbacks.' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, description: 'Prefilled Bangla or English click-to-chat messages with direct task links.' },
]

function localLog(fields) {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    recipient: 'Google Calendar',
    channel: 'Calendar',
    message: 'Google Calendar connection',
    status: 'Sent',
    detail: '',
    actionUrl: '',
    taskId: '',
    ...fields,
  }
}

export function IntegrationsPage() {
  const {
    tasks,
    teamMembers,
    integrationSettings,
    notificationLogs,
    setIntegrationRule,
    setNotificationLanguage,
    updateNotificationStatus,
    clearNotificationLogs,
    sendIntegrationTest,
    addNotificationLog,
  } = useApp()
  const [testing, setTesting] = useState(null)
  const [, setCalendarVersion] = useState(0)
  const [fallbackTaskId, setFallbackTaskId] = useState(tasks[0]?.id ?? '')
  const [notice, setNotice] = useState('')
  const manager = teamMembers.find((member) => member.id === 'member-nusrat') ?? teamMembers[0]
  const emailConfig = getEmailConfiguration()
  const calendarConfig = getGoogleCalendarConfiguration()
  const whatsappConnected = Boolean(normalizeWhatsAppNumber(manager?.whatsapp))
  const fallbackTask = tasks.find((task) => task.id === fallbackTaskId) ?? tasks[0]

  const serviceState = {
    email: { connected: emailConfig.configured, label: emailConfig.configured ? 'Connected' : 'Setup required' },
    calendar: { connected: calendarConfig.connected, label: calendarConfig.connected ? 'Connected' : calendarConfig.configured ? 'Not connected' : 'Setup required' },
    whatsapp: { connected: whatsappConnected, label: whatsappConnected ? 'Connected' : 'Number required' },
  }

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  async function handleConnectGoogle() {
    try {
      await connectGoogleCalendar()
      setCalendarVersion((value) => value + 1)
      addNotificationLog(localLog({ status: 'Sent', detail: 'OAuth access granted for Calendar event creation.' }))
      showNotice('Google Calendar connected.')
    } catch (error) {
      addNotificationLog(localLog({ status: 'Failed', detail: error instanceof Error ? error.message : 'Google authorization failed.' }))
      showNotice('Google Calendar connection failed. See the notification log.')
    }
  }

  function handleDisconnectGoogle() {
    disconnectGoogleCalendar()
    setCalendarVersion((value) => value + 1)
    showNotice('Google Calendar disconnected.')
  }

  async function handleTest(service) {
    setTesting(service)
    try {
      const result = await sendIntegrationTest(service)
      showNotice(result.status === 'Failed' ? `${service} test failed. Check the log for details.` : `${service} test completed.`)
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'The integration test failed.')
    } finally {
      setTesting(null)
      setCalendarVersion((value) => value + 1)
    }
  }

  function openFallback() {
    if (!fallbackTask) return
    window.open(createGoogleCalendarLink(fallbackTask), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Workflow automation</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Integrations</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Deliver live notifications through EmailJS, create Google Calendar events, and prepare WhatsApp messages without interrupting the workspace when a provider is unavailable.</p></div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span>WhatsApp language</span><select value={integrationSettings.language} onChange={(event) => setNotificationLanguage(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none"><option value="en">English</option><option value="bn">বাংলা</option></select></label>
      </header>

      {(!emailConfig.configured || !calendarConfig.configured) && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-4">
          <div className="flex items-start gap-3"><KeyRound size={18} className="mt-0.5 shrink-0 text-slate-600" /><div><h2 className="text-sm font-semibold text-slate-900">Provider credentials required</h2><p className="mt-1 text-xs leading-5 text-slate-600">Add the missing Vite variables and restart the development server. Failed delivery attempts stay visible in the log instead of crashing the app.</p><div className="mt-3 flex flex-wrap gap-2">{[...emailConfig.missing, ...calendarConfig.missing].map((key) => <code key={key} className="rounded bg-white px-2 py-1 text-[10px] text-slate-600 ring-1 ring-amber-200">{key}</code>)}</div></div></div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        {services.map((service) => {
          const state = serviceState[service.id]
          const rules = integrationRules.filter((rule) => rule.service === service.id)
          let connectionAction = null
          if (service.id === 'calendar') {
            connectionAction = calendarConfig.connected
              ? <Button type="button" variant="secondary" onClick={handleDisconnectGoogle}><Unplug size={15} />Disconnect</Button>
              : <Button type="button" onClick={handleConnectGoogle}><PlugZap size={15} />Connect Google</Button>
          }
          return <ServiceCard key={service.id} {...service} connected={state.connected} statusLabel={state.label} rules={rules} settings={integrationSettings} onToggleRule={setIntegrationRule} onTest={() => handleTest(service.id)} testing={testing === service.id} connectionAction={connectionAction} />
        })}
      </section>

      <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-card lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div><div className="flex items-center gap-2"><CalendarPlus size={16} className="text-slate-600" /><h2 className="text-sm font-semibold text-slate-900">Calendar fallback</h2></div><p className="mt-1 text-xs leading-5 text-slate-500">Use a Google Calendar link or standards-based .ics file whenever OAuth is unavailable.</p><label className="mt-4 block"><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Task deadline</span><select value={fallbackTask?.id ?? ''} onChange={(event) => setFallbackTaskId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{tasks.map((task) => <option key={task.id} value={task.id}>{task.id} · {task.title} · {task.dueDate}</option>)}</select></label></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={!fallbackTask} onClick={openFallback}><ExternalLink size={15} />Calendar link</Button><Button type="button" variant="secondary" disabled={!fallbackTask} onClick={() => fallbackTask && downloadDeadlineIcs(fallbackTask)}><Download size={15} />Download .ics</Button></div>
      </section>

      <NotificationLog logs={notificationLogs} tasks={tasks} onMarkOpened={(logId) => updateNotificationStatus(logId, 'Opened')} onClear={clearNotificationLogs} />

      <section className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-4 text-xs text-slate-500">
        <div className="flex items-start gap-3"><CircleAlert size={16} className="mt-0.5 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-700">Live delivery behavior</p><p className="mt-1 leading-5">Email and Calendar requests use the configured provider directly. WhatsApp intentionally uses <code>wa.me</code>: automation prepares the message, and a person opens it from the log before sending.</p></div></div>
      </section>

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[1100] flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-pop"><Check size={15} className="text-slate-600" />{notice}</div>}
    </div>
  )
}
