import { relativeToToday } from '../utils/reports'
import { waterBodies } from './waterBodies'

/** A 3:2 box around the outline, used for every image crop of the site. Returns [west, south, east, north]. */
function imageBox([south, west, north, east]) {
  const centerLat = (south + north) / 2
  const centerLon = (west + east) / 2
  const widthKm = (east - west) * Math.cos((centerLat * Math.PI) / 180)
  const halfHeight = Math.max((north - south) * 0.7, (widthKm * 0.7) / 1.5)
  const halfWidth = (halfHeight * 1.5) / Math.cos((centerLat * Math.PI) / 180)
  return [centerLon - halfWidth, centerLat - halfHeight, centerLon + halfWidth, centerLat + halfHeight].map((value) => Number(value.toFixed(5)))
}

/** Current satellite crop of the site from Esri World Imagery. */
function satelliteThumbnail(box) {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${box.join(',')}&bboxSR=4326&imageSR=4326&size=480,320&format=jpg&f=image`
}

/**
 * A site record from an outline: `body` has id, name, location, areaHa, center, bbox ([south, west, north, east]),
 * ring and holes. Extra fields (type, authority, who added it) are kept on the record.
 */
export function buildSite(body, { status, reviewNote, boundarySource, ...extra }) {
  const box = imageBox(body.bbox)
  return {
    id: body.id,
    name: body.name,
    location: body.location,
    area: `${body.areaHa.toFixed(1)} ha`,
    areaHa: body.areaHa,
    status,
    coordinates: body.center,
    boundary: body.ring,
    boundaryHoles: body.holes ?? [],
    boundarySource,
    boundaryVerified: false,
    imageBox: box,
    image: satelliteThumbnail(box),
    reviewNote,
    ...extra,
  }
}

function createSite(id, status, reviewNote) {
  const body = waterBodies[id]
  return buildSite(body, { status, reviewNote, boundarySource: 'OpenStreetMap, ' + body.osm })
}

export const dashboardSites = [
  createSite('gulshan-baridhara-lake', 'needs_review', 'Queued for a dated satellite comparison and a field visit.'),
  createSite('hatirjheel', 'needs_review', 'Large urban water body with a mapped shoreline. Boundary reference points are still being confirmed.'),
  createSite('dhanmondi-lake', 'no_change', 'Sample classification: not yet confirmed by a measured comparison.'),
  createSite('ramna-lake', 'no_change', 'Sample classification: not yet confirmed by a measured comparison.'),
  createSite('gol-talab', 'insufficient_data', 'Smaller than one hectare. A 10 m satellite pixel is too coarse for a defensible comparison, so field evidence is needed.'),
]

const seedTasks = [
  {
    id: 'TL-105', title: 'Inspect reported fill and fencing at Hatirjheel', description: 'Visit the bank reported in RPT-001, photograph the fill material and the fence, and measure how far it extends into the water.', site: 'Hatirjheel Lake', siteId: 'hatirjheel', reportId: 'RPT-001', assignee: 'Rahim Uddin', initials: 'RU', due: '22 Oct', dueDate: '2026-10-22', status: 'open', priority: 'High', estimatedCost: 4500, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-07T09:00:00.000Z', notifications: { email: true, calendar: true }, comments: [], activityHistory: [{ id: 'history-105-1', action: 'Task created from verified report RPT-001', actor: 'Nusrat Jahan', time: '07 Oct 2026' }],
  },
  {
    id: 'TL-104', title: 'Verify water-area change', description: 'Visit Gulshan–Baridhara Lake and verify the reviewed satellite comparison using geotagged field evidence.', site: 'Gulshan–Baridhara Lake', siteId: 'gulshan-baridhara-lake', assignee: 'Rahim Uddin', initials: 'RU', due: 'Today', dueDate: '2026-10-09', status: 'open', priority: 'High', estimatedCost: 6500, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-08T09:00:00.000Z', notifications: { email: true, calendar: true }, comments: [], activityHistory: [{ id: 'history-104-1', action: 'Task created from Gulshan–Baridhara Lake observation', actor: 'Nusrat Jahan', time: '08 Oct 2026' }],
  },
  {
    id: 'TL-103', title: 'Upload site visit evidence', description: 'Organize photographs and field notes from the latest Hatirjheel Lake visit.', site: 'Hatirjheel Lake', siteId: 'hatirjheel', assignee: 'Imran Hossain', initials: 'IH', due: 'Tomorrow', dueDate: '2026-10-10', status: 'in_progress', priority: 'Medium', estimatedCost: 3200, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-06T08:30:00.000Z', notifications: { email: true, calendar: false }, comments: [{ id: 'comment-103-1', author: 'Imran Hossain', text: 'Field photographs received and awaiting final labels.', time: '08 Oct 2026' }], activityHistory: [{ id: 'history-103-1', action: 'Status changed to In progress', actor: 'Imran Hossain', time: '07 Oct 2026' }],
  },
  {
    id: 'TL-102', title: 'Review imagery suitability', description: 'Confirm whether a water body under one hectare can be compared on 10 m imagery or needs field evidence instead.', site: 'Gol Talab', siteId: 'gol-talab', assignee: 'Maliha Rahman', initials: 'MR', due: '12 Oct', dueDate: '2026-10-12', status: 'open', priority: 'Medium', estimatedCost: 2400, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-05T10:15:00.000Z', notifications: { email: true, calendar: true }, comments: [], activityHistory: [{ id: 'history-102-1', action: 'Task approved for technical review', actor: 'Nusrat Jahan', time: '06 Oct 2026' }],
  },
  {
    id: 'TL-101', title: 'Validate seasonal comparison', description: 'Confirm that both Ramna Lake observations represent a comparable seasonal window.', site: 'Ramna Lake', siteId: 'ramna-lake', assignee: 'Rahim Uddin', initials: 'RU', due: '14 Oct', dueDate: '2026-10-14', status: 'open', priority: 'Low', estimatedCost: 1800, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-04T07:45:00.000Z', notifications: { email: false, calendar: true }, comments: [], activityHistory: [{ id: 'history-101-1', action: 'Task created for seasonal validation', actor: 'Nusrat Jahan', time: '04 Oct 2026' }],
  },
  {
    id: 'TL-100', title: 'Complete Dhanmondi Lake inspection', description: 'Record the routine field inspection and attach the completion note.', site: 'Dhanmondi Lake', siteId: 'dhanmondi-lake', assignee: 'Rahim Uddin', initials: 'RU', due: '05 Oct', dueDate: '2026-10-05', status: 'completed', resolution: { outcome: 'resolved', note: 'Routine inspection recorded; no issue found.', by: 'Nusrat Jahan', at: '2026-10-06T09:00:00.000Z' }, priority: 'Low', estimatedCost: 2800, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-01T08:00:00.000Z', notifications: { email: true, calendar: true }, comments: [{ id: 'comment-100-1', author: 'Rahim Uddin', text: 'Inspection completed; no immediate intervention required.', time: '05 Oct 2026' }], activityHistory: [{ id: 'history-100-1', action: 'Completion reported with field note', actor: 'Rahim Uddin', time: '05 Oct 2026' }],
  },
  {
    id: 'TL-099', title: 'Confirm boundary reference points', description: 'Review the recorded boundary points before the next comparison is approved.', site: 'Hatirjheel Lake', siteId: 'hatirjheel', assignee: 'Imran Hossain', initials: 'IH', due: '07 Oct', dueDate: '2026-10-07', status: 'open', priority: 'High', estimatedCost: 2100, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-02T11:30:00.000Z', notifications: { email: true, calendar: true }, comments: [], activityHistory: [{ id: 'history-099-1', action: 'Task approved and assigned', actor: 'Nusrat Jahan', time: '03 Oct 2026' }],
  },
  {
    id: 'TL-098', title: 'Survey shoreline encroachment at Ramna Lake', description: 'Walk the western shoreline, mark any new structures with GPS points and photograph each one.', site: 'Ramna Lake', siteId: 'ramna-lake', assignee: 'Maliha Rahman', initials: 'MR', due: '13 Oct', dueDate: '2026-10-13', status: 'in_progress', priority: 'Medium', estimatedCost: 3600, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-05T09:20:00.000Z', notifications: { email: true, calendar: true }, comments: [{ id: 'comment-098-1', author: 'Maliha Rahman', text: 'Western half surveyed; 3 new structures marked.', time: '08 Oct 2026' }], activityHistory: [{ id: 'history-098-1', action: 'Status changed to In progress', actor: 'Maliha Rahman', time: '06 Oct 2026' }],
  },
  {
    id: 'TL-097', title: 'Collect water samples near Gulshan outfall', description: 'Take three samples at the storm-water outfall and deliver them to the partner lab within 24 hours.', site: 'Gulshan–Baridhara Lake', siteId: 'gulshan-baridhara-lake', assignee: 'Rahim Uddin', initials: 'RU', due: '15 Oct', dueDate: '2026-10-15', status: 'in_progress', priority: 'High', estimatedCost: 5200, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-06T10:00:00.000Z', notifications: { email: true, calendar: true }, comments: [], activityHistory: [{ id: 'history-097-1', action: 'Status changed to In progress', actor: 'Rahim Uddin', time: '07 Oct 2026' }],
  },
  {
    id: 'TL-096', title: 'Measure fill depth along Hatirjheel east bank', description: 'Measure the depth of the new fill at five points along the east bank and record the extent on the site map.', site: 'Hatirjheel Lake', siteId: 'hatirjheel', assignee: 'Imran Hossain', initials: 'IH', due: '11 Oct', dueDate: '2026-10-11', status: 'blocked', blockedReason: 'Site access closed by the contractor; waiting for permission from the local ward office.', priority: 'High', estimatedCost: 4800, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-04T08:15:00.000Z', notifications: { email: true, calendar: true }, comments: [{ id: 'comment-096-1', author: 'Imran Hossain', text: 'Gate locked on arrival. Contacted ward office for access.', time: '08 Oct 2026' }], activityHistory: [{ id: 'history-096-1', action: 'Marked blocked: site access closed', actor: 'Imran Hossain', time: '08 Oct 2026' }],
  },
  {
    id: 'TL-095', title: 'Photograph Gol Talab inlet drain', description: 'Photograph the inlet drain from both banks to check whether it is still connected to the pond.', site: 'Gol Talab', siteId: 'gol-talab', assignee: 'Maliha Rahman', initials: 'MR', due: '16 Oct', dueDate: '2026-10-16', status: 'blocked', blockedReason: 'Heavy rain has submerged the inlet; revisit once the water level drops.', priority: 'Medium', estimatedCost: 1500, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-05T12:40:00.000Z', notifications: { email: true, calendar: false }, comments: [], activityHistory: [{ id: 'history-095-1', action: 'Marked blocked: inlet submerged', actor: 'Maliha Rahman', time: '07 Oct 2026' }],
  },
  {
    id: 'TL-094', title: 'Re-survey Dhanmondi Lake walkway edge', description: 'Re-measure the walkway edge where the previous survey showed a 2 m shift and attach photographs.', site: 'Dhanmondi Lake', siteId: 'dhanmondi-lake', assignee: 'Rahim Uddin', initials: 'RU', due: '12 Oct', dueDate: '2026-10-12', status: 'awaiting_verification', priority: 'Medium', estimatedCost: 2900, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-03T09:00:00.000Z', notifications: { email: true, calendar: true }, comments: [], submissions: [{ id: 'sub-TL-094-1', summary: 'Walkway edge re-measured at six points; the shift is a survey error, not new fill.', photos: [], completedOn: '2026-10-08', followUp: '', expensesStatus: 'recorded', submittedBy: 'Rahim Uddin', submittedAt: '2026-10-08T15:30:00.000Z' }], activityHistory: [{ id: 'history-094-1', action: 'Completion evidence submitted', actor: 'Rahim Uddin', time: '08 Oct 2026' }],
  },
  {
    id: 'TL-093', title: 'Document dumping site at Gulshan north bank', description: 'Photograph the dumping site reported by residents and estimate the covered area.', site: 'Gulshan–Baridhara Lake', siteId: 'gulshan-baridhara-lake', assignee: 'Imran Hossain', initials: 'IH', due: '14 Oct', dueDate: '2026-10-14', status: 'awaiting_verification', priority: 'High', estimatedCost: 3400, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-04T11:10:00.000Z', notifications: { email: true, calendar: true }, comments: [{ id: 'comment-093-1', author: 'Imran Hossain', text: 'Area roughly 120 m². Waste is mostly construction debris.', time: '09 Oct 2026' }], submissions: [{ id: 'sub-TL-093-1', summary: 'Dumping site documented; about 120 m² of construction debris on the north bank.', photos: [], completedOn: '2026-10-09', followUp: 'Ask the city corporation to schedule removal.', expensesStatus: 'recorded', submittedBy: 'Imran Hossain', submittedAt: '2026-10-09T13:00:00.000Z' }], activityHistory: [{ id: 'history-093-1', action: 'Completion evidence submitted', actor: 'Imran Hossain', time: '09 Oct 2026' }],
  },
  {
    id: 'TL-092', title: 'Map Ramna Lake inflow channels', description: 'Trace the inflow channels on the field map and note any that are blocked.', site: 'Ramna Lake', siteId: 'ramna-lake', assignee: 'Maliha Rahman', initials: 'MR', due: '03 Oct', dueDate: '2026-10-03', status: 'completed', resolution: { outcome: 'resolved', note: 'Channels mapped; one blockage reported to the park authority.', by: 'Nusrat Jahan', at: '2026-10-04T10:00:00.000Z' }, priority: 'Low', estimatedCost: 2200, assignedBy: 'Nusrat Jahan', createdAt: '2026-09-28T08:00:00.000Z', notifications: { email: true, calendar: true }, comments: [], activityHistory: [{ id: 'history-092-1', action: 'Task closed as resolved', actor: 'Nusrat Jahan', time: '04 Oct 2026' }],
  },
  {
    id: 'TL-091', title: 'Verify Gol Talab boundary markers', description: 'Check that the four boundary markers are in place and photograph each one.', site: 'Gol Talab', siteId: 'gol-talab', assignee: 'Imran Hossain', initials: 'IH', due: '02 Oct', dueDate: '2026-10-02', status: 'completed', resolution: { outcome: 'resolved', note: 'All four markers found intact.', by: 'Nusrat Jahan', at: '2026-10-03T09:30:00.000Z' }, priority: 'Medium', estimatedCost: 1900, assignedBy: 'Nusrat Jahan', createdAt: '2026-09-27T08:00:00.000Z', notifications: { email: true, calendar: true }, comments: [], activityHistory: [{ id: 'history-091-1', action: 'Task closed as resolved', actor: 'Nusrat Jahan', time: '03 Oct 2026' }],
  },
]

export const dashboardTasks = seedTasks.map((task) => ({ ...task, dueDate: relativeToToday(task.dueDate) }))
