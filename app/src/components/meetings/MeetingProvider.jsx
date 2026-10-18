import { useCallback, useMemo, useState } from 'react'
import { MeetingContext } from '../../context/meeting-context'
import { useApp } from '../../hooks/useApp'
import { MeetingModal } from './MeetingModal'

/** Lets any page open the Google Meet dialog with `openMeeting(prefill)`; the dialog itself is rendered once, here. */
export function MeetingProvider({ children }) {
  const { can, sites, teamMembers, scheduleMeeting } = useApp()
  const [request, setRequest] = useState(null)
  const canMeet = can('schedule.manage')

  const openMeeting = useCallback((prefill = {}) => setRequest({ ...prefill, key: Date.now() }), [])
  const value = useMemo(() => ({ openMeeting, canMeet }), [openMeeting, canMeet])
  const site = request?.site ?? sites.find((item) => item.id === (request?.task?.siteId ?? request?.siteId))

  return (
    <MeetingContext.Provider value={value}>
      {children}
      {request && canMeet && (
        <MeetingModal
          key={request.key}
          request={{ ...request, site }}
          members={teamMembers}
          onClose={() => setRequest(null)}
          onCreate={(form) => scheduleMeeting({ ...form, task: request.task ?? null, siteId: site?.id ?? '' })}
        />
      )}
    </MeetingContext.Provider>
  )
}
