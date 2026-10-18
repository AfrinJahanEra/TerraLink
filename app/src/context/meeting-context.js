import { createContext } from 'react'

/** `openMeeting({ task, site, title, agenda, guests })` opens the Google Meet dialog with those details filled in. */
export const MeetingContext = createContext(null)
