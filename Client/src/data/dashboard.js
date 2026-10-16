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

function createSite(id, status, reviewNote) {
  const body = waterBodies[id]
  const box = imageBox(body.bbox)
  return {
    id,
    name: body.name,
    location: body.location,
    area: `${body.areaHa.toFixed(1)} ha`,
    areaHa: body.areaHa,
    status,
    coordinates: body.center,
    boundary: body.ring,
    boundaryHoles: body.holes,
    boundarySource: 'OpenStreetMap, ' + body.osm,
    boundaryVerified: false,
    imageBox: box,
    image: satelliteThumbnail(box),
    reviewNote,
  }
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
    id: 'TL-105', title: 'Inspect reported fill and fencing at Hatirjheel', description: 'Visit the bank reported in RPT-001, photograph the fill material and the fence, and measure how far it extends into the water.', site: 'Hatirjheel Lake', siteId: 'hatirjheel', reportId: 'RPT-001', assignee: 'Rahim Uddin', initials: 'RU', due: '22 Oct', dueDate: '2026-10-22', status: 'open', priority: 'High', estimatedCost: 4500, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-07T09:00:00.000Z', notifications: { email: true, calendar: true, whatsapp: true }, comments: [], activityHistory: [{ id: 'history-105-1', action: 'Task created from verified report RPT-001', actor: 'Nusrat Jahan', time: '07 Oct 2026' }],
  },
  {
    id: 'TL-104', title: 'Verify water-area change', description: 'Visit Gulshan–Baridhara Lake and verify the reviewed satellite comparison using geotagged field evidence.', site: 'Gulshan–Baridhara Lake', siteId: 'gulshan-baridhara-lake', assignee: 'Rahim Uddin', initials: 'RU', due: 'Today', dueDate: '2026-10-09', status: 'open', priority: 'High', estimatedCost: 6500, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-08T09:00:00.000Z', notifications: { email: true, calendar: true, whatsapp: true }, comments: [], activityHistory: [{ id: 'history-104-1', action: 'Task created from Gulshan–Baridhara Lake observation', actor: 'Nusrat Jahan', time: '08 Oct 2026' }],
  },
  {
    id: 'TL-103', title: 'Upload site visit evidence', description: 'Organize photographs and field notes from the latest Hatirjheel Lake visit.', site: 'Hatirjheel Lake', siteId: 'hatirjheel', assignee: 'Sadia Akter', initials: 'SA', due: 'Tomorrow', dueDate: '2026-10-10', status: 'in_progress', priority: 'Medium', estimatedCost: 3200, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-06T08:30:00.000Z', notifications: { email: true, calendar: false, whatsapp: false }, comments: [{ id: 'comment-103-1', author: 'Sadia Akter', text: 'Field photographs received and awaiting final labels.', time: '08 Oct 2026' }], activityHistory: [{ id: 'history-103-1', action: 'Status changed to In progress', actor: 'Sadia Akter', time: '07 Oct 2026' }],
  },
  {
    id: 'TL-102', title: 'Review imagery suitability', description: 'Confirm whether a water body under one hectare can be compared on 10 m imagery or needs field evidence instead.', site: 'Gol Talab', siteId: 'gol-talab', assignee: 'Tanvir Hasan', initials: 'TH', due: '12 Oct', dueDate: '2026-10-12', status: 'open', priority: 'Medium', estimatedCost: 2400, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-05T10:15:00.000Z', notifications: { email: true, calendar: true, whatsapp: false }, comments: [], activityHistory: [{ id: 'history-102-1', action: 'Task approved for technical review', actor: 'Nusrat Jahan', time: '06 Oct 2026' }],
  },
  {
    id: 'TL-101', title: 'Validate seasonal comparison', description: 'Confirm that both Ramna Lake observations represent a comparable seasonal window.', site: 'Ramna Lake', siteId: 'ramna-lake', assignee: 'Rahim Uddin', initials: 'RU', due: '14 Oct', dueDate: '2026-10-14', status: 'open', priority: 'Low', estimatedCost: 1800, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-04T07:45:00.000Z', notifications: { email: false, calendar: true, whatsapp: false }, comments: [], activityHistory: [{ id: 'history-101-1', action: 'Task created for seasonal validation', actor: 'Nusrat Jahan', time: '04 Oct 2026' }],
  },
  {
    id: 'TL-100', title: 'Complete Dhanmondi Lake inspection', description: 'Record the routine field inspection and attach the completion note.', site: 'Dhanmondi Lake', siteId: 'dhanmondi-lake', assignee: 'Rahim Uddin', initials: 'RU', due: '05 Oct', dueDate: '2026-10-05', status: 'completed', resolution: { outcome: 'resolved', note: 'Routine inspection recorded; no issue found.', by: 'Nusrat Jahan', at: '2026-10-06T09:00:00.000Z' }, priority: 'Low', estimatedCost: 2800, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-01T08:00:00.000Z', notifications: { email: true, calendar: true, whatsapp: false }, comments: [{ id: 'comment-100-1', author: 'Rahim Uddin', text: 'Inspection completed; no immediate intervention required.', time: '05 Oct 2026' }], activityHistory: [{ id: 'history-100-1', action: 'Completion reported with field note', actor: 'Rahim Uddin', time: '05 Oct 2026' }],
  },
  {
    id: 'TL-099', title: 'Confirm boundary reference points', description: 'Review the recorded boundary points before the next comparison is approved.', site: 'Hatirjheel Lake', siteId: 'hatirjheel', assignee: 'Sadia Akter', initials: 'SA', due: '07 Oct', dueDate: '2026-10-07', status: 'open', priority: 'High', estimatedCost: 2100, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-02T11:30:00.000Z', notifications: { email: true, calendar: true, whatsapp: true }, comments: [], activityHistory: [{ id: 'history-099-1', action: 'Task approved and assigned', actor: 'Nusrat Jahan', time: '03 Oct 2026' }],
  },
]

export const dashboardTasks = seedTasks.map((task) => ({ ...task, dueDate: relativeToToday(task.dueDate) }))
