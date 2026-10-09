import { CalendarDays, Mail, MessageCircle, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NotificationLog } from '../components/integrations/NotificationLog'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { useApp } from '../hooks/useApp'

const channels = [
  { id: 'Email', icon: Mail, text: 'Assignment notices, meeting invitations, reminders, and shared reports are delivered through EmailJS.' },
  { id: 'Calendar', icon: CalendarDays, text: 'Meetings and task deadlines are added to Google Calendar, or downloaded as .ics files.' },
  { id: 'WhatsApp', icon: MessageCircle, text: 'Reminders are prepared as click-to-chat messages and confirmed by the sender in WhatsApp.' },
]

export function CommunicationsPage() {
  const { role, notificationLogs, updateNotificationStatus, clearNotificationLogs } = useApp()
  const isManager = role.id === 'manager'
  const count = (predicate) => notificationLogs.filter(predicate).length
  const failed = count((log) => log.status === 'Failed')

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <PageHeader
        eyebrow="Administration"
        title="Communications"
        description="A single outbox for every email, calendar event, and WhatsApp reminder sent from tasks, meetings, budgets, and reports."
        actions={isManager && <Button as={Link} to="/settings?tab=services" variant="secondary"><Settings size={15} />Delivery settings</Button>}
      />

      <SummaryStrip
        items={[
          { label: 'total records', value: notificationLogs.length },
          { label: 'emails', value: count((log) => log.channel === 'Email') },
          { label: 'calendar events', value: count((log) => log.channel === 'Calendar') },
          { label: 'WhatsApp reminders', value: count((log) => log.channel === 'WhatsApp') },
          { label: 'failed', value: failed, tone: failed ? 'rose' : undefined },
        ]}
        note="Stored in this browser for the prototype"
      />

      <div className="grid gap-3 md:grid-cols-3">
        {channels.map(({ id, icon: Icon, text }) => (
          <div key={id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-card">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={15} /></span>
            <div><p className="text-xs font-semibold text-slate-800">{id}</p><p className="mt-0.5 text-[11px] leading-5 text-slate-500">{text}</p></div>
          </div>
        ))}
      </div>

      <NotificationLog
        logs={notificationLogs}
        onMarkOpened={(logId) => updateNotificationStatus(logId, 'Opened')}
        onClear={isManager ? clearNotificationLogs : undefined}
      />
    </div>
  )
}
