import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NotificationLog } from '../components/integrations/NotificationLog'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SummaryStrip } from '../components/ui/SummaryStrip'
import { useApp } from '../hooks/useApp'

export function CommunicationsPage() {
  const { can, notificationLogs, updateNotificationStatus, clearNotificationLogs } = useApp()
  const isManager = can('settings.manage')
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
      />

      <NotificationLog
        logs={notificationLogs}
        onMarkOpened={(logId) => updateNotificationStatus(logId, 'Opened')}
        onClear={isManager ? clearNotificationLogs : undefined}
      />
    </div>
  )
}
