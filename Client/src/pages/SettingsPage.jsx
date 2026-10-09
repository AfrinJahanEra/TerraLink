import {
  Building2,
  CalendarDays,
  Database,
  Download,
  KeyRound,
  Mail,
  MessageCircle,
  PlugZap,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Unplug,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ServiceCard } from '../components/integrations/ServiceCard'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Toast } from '../components/ui/Toast'
import { integrationRules, ORGANIZATION_PROFILE } from '../data/integrations'
import { useApp } from '../hooks/useApp'
import { useNotice } from '../hooks/useNotice'
import { createLog } from '../services/automation'
import { connectGoogleCalendar, disconnectGoogleCalendar, getGoogleCalendarConfiguration } from '../services/calendar'
import { getEmailConfiguration } from '../services/email'
import { normalizeWhatsAppNumber } from '../services/whatsapp'
import { cn } from '../utils/cn'
import { todayKey } from '../utils/schedule'

const tabs = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'services', label: 'Connected services', icon: PlugZap },
  { id: 'data', label: 'Data', icon: Database },
]

const services = [
  { id: 'email', name: 'EmailJS', icon: Mail, description: 'Delivers assignment notices, meeting invitations, reminders, budget alerts, and shared reports.' },
  { id: 'calendar', name: 'Google Calendar', icon: CalendarDays, description: 'Creates meeting and deadline events directly when connected; otherwise opens a prefilled event.' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, description: 'Prepares Bangla or English click-to-chat reminders that the sender confirms in WhatsApp.' },
]

const triggers = [
  { module: 'Tasks', to: '/tasks', actions: 'Deadline to calendar, email reminder, WhatsApp reminder' },
  { module: 'Schedule & meetings', to: '/schedule', actions: 'Calendar event, .ics file, email invitations, WhatsApp reminders' },
  { module: 'Reports', to: '/reports', actions: 'Share report summary by email, schedule a briefing' },
  { module: 'Budgets & expenses', to: '/budget', actions: 'Automatic overrun alert, schedule a budget review' },
]

function Field({ label, children }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[11px] font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-xs text-slate-800 sm:mt-0">{children}</dd>
    </div>
  )
}

function Panel({ title, description, children, className }) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white shadow-card', className)}>
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">{title}</h2>{description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}</div>
      <div className="px-5">{children}</div>
    </section>
  )
}

export function SettingsPage() {
  const {
    role, sites, tasks, meetings, expenses, teamMembers, notificationLogs, integrationSettings,
    setIntegrationRule, setNotificationLanguage, sendIntegrationTest, addNotificationLog, clearNotificationLogs, resetDemo,
  } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [testing, setTesting] = useState(null)
  const [, setCalendarVersion] = useState(0)
  const [confirmReset, setConfirmReset] = useState(false)
  const [notice, showNotice] = useNotice(3500)
  const activeTab = tabs.some((tab) => tab.id === searchParams.get('tab')) ? searchParams.get('tab') : 'general'

  const manager = teamMembers.find((member) => member.id === 'member-nusrat') ?? teamMembers[0]
  const emailConfig = getEmailConfiguration()
  const calendarConfig = getGoogleCalendarConfiguration()
  const whatsappConnected = Boolean(normalizeWhatsAppNumber(manager?.whatsapp))
  const serviceState = {
    email: { connected: emailConfig.configured, label: emailConfig.configured ? 'Connected' : 'Setup required' },
    calendar: { connected: calendarConfig.connected, label: calendarConfig.connected ? 'Connected' : calendarConfig.configured ? 'Not connected' : 'Setup required' },
    whatsapp: { connected: whatsappConnected, label: whatsappConnected ? 'Connected' : 'Number required' },
  }
  const missingKeys = [...emailConfig.missing, ...calendarConfig.missing]

  function calendarLog(fields) {
    return createLog({ recipient: 'Google Calendar', channel: 'Calendar', message: 'Google Calendar connection', source: 'Settings', ...fields })
  }

  async function handleConnectGoogle() {
    try {
      await connectGoogleCalendar()
      setCalendarVersion((value) => value + 1)
      addNotificationLog(calendarLog({ status: 'Sent', detail: 'OAuth access granted for Calendar event creation.' }))
      showNotice('Google Calendar connected. Meetings and deadlines will now be created directly.')
    } catch (error) {
      addNotificationLog(calendarLog({ status: 'Failed', detail: error instanceof Error ? error.message : 'Google authorization failed.' }))
      showNotice('Google Calendar connection failed. See Communications for details.')
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
      const name = services.find((item) => item.id === service)?.name ?? service
      showNotice(result.status === 'Failed' ? `${name} test failed: ${result.detail}` : `${name} test completed.`)
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'The connection test failed.')
    } finally {
      setTesting(null)
      setCalendarVersion((value) => value + 1)
    }
  }

  function exportWorkspace() {
    const snapshot = { exportedAt: new Date().toISOString(), sites, tasks, meetings, expenses, teamMembers, notificationLogs }
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `terralink-workspace-${todayKey()}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function handleReset() {
    resetDemo()
    setConfirmReset(false)
    showNotice('Demo workspace restored to its original sample data.')
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Organisation profile, connected delivery services, and workspace data. Communications are started from the module where the work happens."
      />

      <nav className="flex gap-1 border-b border-slate-200" aria-label="Settings sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSearchParams(id === 'general' ? {} : { tab: id }, { replace: true })}
            aria-current={activeTab === id ? 'page' : undefined}
            className={cn('-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition', activeTab === id ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            <Icon size={15} className="text-slate-500" />{label}
          </button>
        ))}
      </nav>

      {activeTab === 'general' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Organisation" description="Shown on reports, invitations, and calendar events">
            <dl className="divide-y divide-slate-100">
              <Field label="Programme">{ORGANIZATION_PROFILE.name}</Field>
              <Field label="Implementing unit">{ORGANIZATION_PROFILE.partner}</Field>
              <Field label="Office">{ORGANIZATION_PROFILE.office}</Field>
              <Field label="Time zone">{ORGANIZATION_PROFILE.timeZone}</Field>
              <Field label="Work week">{ORGANIZATION_PROFILE.workWeek}</Field>
              <Field label="Currency">{ORGANIZATION_PROFILE.currency}</Field>
            </dl>
          </Panel>
          <div className="space-y-5">
            <Panel title="Preferences">
              <dl className="divide-y divide-slate-100">
                <Field label="WhatsApp message language">
                  <select value={integrationSettings.language} onChange={(event) => { setNotificationLanguage(event.target.value); showNotice('Message language updated.') }} aria-label="WhatsApp message language" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">
                    <option value="en">English</option>
                    <option value="bn">বাংলা (Bangla)</option>
                  </select>
                </Field>
                <Field label="Interface language">English</Field>
                <Field label="Assistant answers">Bangla</Field>
              </dl>
            </Panel>
            <Panel title="Signed in as">
              <dl className="divide-y divide-slate-100">
                <Field label="Name">{role.user.name}</Field>
                <Field label="Email">{role.user.email ?? '—'}</Field>
                <Field label="Role">{role.label}</Field>
                <Field label="Team directory"><Link to="/team" className="font-semibold text-brand-700 hover:text-brand-900">Manage team members</Link></Field>
              </dl>
            </Panel>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-5">
          {!!missingKeys.length && (
            <section className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-start gap-3"><KeyRound size={18} className="mt-0.5 shrink-0 text-slate-600" /><div><h2 className="text-sm font-semibold text-slate-900">Provider credentials required</h2><p className="mt-1 text-xs leading-5 text-slate-600">Add the missing Vite variables and restart the development server. Until then, calendar actions open a prefilled Google Calendar page and failed emails are recorded in Communications.</p><div className="mt-3 flex flex-wrap gap-2">{missingKeys.map((key) => <code key={key} className="rounded bg-white px-2 py-1 text-[10px] text-slate-600 ring-1 ring-slate-200">{key}</code>)}</div></div></div>
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
                  : <Button type="button" onClick={handleConnectGoogle} disabled={!calendarConfig.configured}><PlugZap size={15} />Connect Google</Button>
              }
              return <ServiceCard key={service.id} {...service} connected={state.connected} statusLabel={state.label} rules={rules} settings={integrationSettings} onToggleRule={setIntegrationRule} onTest={() => handleTest(service.id)} testing={testing === service.id} connectionAction={connectionAction} />
            })}
          </section>

          <Panel title="Where communications are started" description="Services are used from inside each workflow, not from a separate page">
            <ul className="divide-y divide-slate-100">
              {triggers.map((item) => (
                <li key={item.module} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link to={item.to} className="w-44 shrink-0 text-xs font-semibold text-slate-800 hover:text-brand-700">{item.module}</Link>
                  <span className="text-[11px] text-slate-500">{item.actions}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Workspace records" description="Stored in this browser for the prototype">
            <dl className="divide-y divide-slate-100">
              <Field label="Sites">{sites.length}</Field>
              <Field label="Tasks">{tasks.length}</Field>
              <Field label="Meetings">{meetings.length}</Field>
              <Field label="Expenses">{expenses.length}</Field>
              <Field label="Team members">{teamMembers.length}</Field>
              <Field label="Communication records">{notificationLogs.length}</Field>
            </dl>
            <div className="border-t border-slate-100 py-4"><Button type="button" variant="secondary" onClick={exportWorkspace}><Download size={15} />Export workspace (JSON)</Button></div>
          </Panel>

          <Panel title="Maintenance" description="Actions that change stored workspace data">
            <div className="divide-y divide-slate-100">
              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-semibold text-slate-800">Clear communication log</p><p className="mt-0.5 text-[11px] leading-5 text-slate-500">Removes outbox records. Delivered emails and calendar events are not affected.</p></div>
                <Button type="button" variant="secondary" disabled={!notificationLogs.length} onClick={() => { clearNotificationLogs(); showNotice('Communication log cleared.') }}><Trash2 size={15} />Clear log</Button>
              </div>
              <div className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-xs font-semibold text-slate-800">Reset demo workspace</p><p className="mt-0.5 text-[11px] leading-5 text-slate-500">Restores sample sites, tasks, meetings, budgets, and expenses. Changes made in this browser are lost.</p></div>
                  {!confirmReset && <Button type="button" variant="secondary" onClick={() => setConfirmReset(true)}><RotateCcw size={15} />Reset</Button>}
                </div>
                {confirmReset && (
                  <div role="alert" className="mt-3 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] font-medium text-rose-800">Reset all workspace data to the original sample?</p>
                    <div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button><Button type="button" onClick={handleReset} className="bg-rose-700 hover:bg-rose-800">Confirm reset</Button></div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[10px] text-slate-400"><SlidersHorizontal size={12} className="text-slate-500" />Settings apply to this browser workspace.</p>
      <Toast message={notice} />
    </div>
  )
}
