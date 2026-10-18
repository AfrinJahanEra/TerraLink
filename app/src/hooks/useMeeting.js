import { useContext } from 'react'
import { MeetingContext } from '../context/meeting-context'

/** Opens the "Create meeting" dialog from anywhere in the workspace. `canMeet` is false for roles that cannot schedule. */
export function useMeeting() {
  return useContext(MeetingContext) ?? { openMeeting: () => {}, canMeet: false }
}
