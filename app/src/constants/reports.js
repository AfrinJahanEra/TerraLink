import { Ban, Biohazard, Fence, Ruler, Trash2 } from 'lucide-react'

export const REPORT_CATEGORIES = {
  waste_dumping: { label: 'Waste dumping', icon: Trash2 },
  water_pollution: { label: 'Water pollution concern', icon: Biohazard },
  encroachment: { label: 'Possible encroachment', icon: Fence },
  water_level: { label: 'Water-level concern', icon: Ruler },
  other: { label: 'Other', icon: Ban },
}

/** Review state of a community report. It describes the evidence, not the condition of the water body. */
export const REPORT_STATUS = {
  pending: { label: 'Pending', tone: 'neutral', color: '#94a3b8', meaning: 'Submitted and waiting for review' },
  under_review: { label: 'Under review', tone: 'brandSoft', color: '#46b2b2', meaning: 'A reviewer is examining the evidence' },
  verified: { label: 'Verified', tone: 'brand', color: '#1e6166', meaning: 'Evidence reviewed and accepted' },
  rejected: { label: 'Rejected', tone: 'slate', color: '#cbd5e1', meaning: 'Evidence was not accepted' },
}

export const OPEN_REPORT_STATUSES = ['pending', 'under_review', 'verified']

export const PHOTO_RULES = {
  maxFiles: 3,
  maxBytes: 10 * 1024 * 1024,
  types: ['image/jpeg', 'image/png', 'image/webp'],
}
