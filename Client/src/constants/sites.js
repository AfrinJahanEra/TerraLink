/** Kind of water body. Satellite comparison suits open water; narrow canals and rivers need field evidence. */
export const SITE_TYPES = {
  lake: { label: 'Lake' },
  pond: { label: 'Pond (pukur / talab)' },
  canal: { label: 'Canal (khal)' },
  river: { label: 'River stretch' },
  wetland: { label: 'Wetland or marsh (beel / haor)' },
}

/** Bodies usually responsible for a water body in and around Dhaka. */
export const AUTHORITIES = [
  'Dhaka North City Corporation (DNCC)',
  'Dhaka South City Corporation (DSCC)',
  'RAJUK',
  'Dhaka WASA',
  'Bangladesh Water Development Board (BWDB)',
  'Public Works Department (PWD)',
  'District administration',
  'Private or community owned',
  'Unknown',
]

/** Statuses a new site can start with; the rest come from measurements and decisions. */
export const STARTING_STATUSES = ['needs_review', 'reported_issue', 'no_change', 'insufficient_data']

/** Below this a water body is only a few 10 m Sentinel-2 pixels wide. Matches MIN_RELIABLE_AREA_HA. */
export const SATELLITE_MIN_HA = 1
