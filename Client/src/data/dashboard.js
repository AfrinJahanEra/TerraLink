import pondAfterImage from '../assets/pond-a-after.png'
import pondBeforeImage from '../assets/pond-a-before.png'

export const dashboardSites = [
  {
    id: 'pond-a',
    name: 'Pond A',
    location: 'Gazipur',
    area: '9.5 ha',
    change: -20.8,
    status: 'needs_review',
    coordinates: [23.9992, 90.4204],
    image: pondAfterImage,
    beforeImage: pondBeforeImage,
    afterImage: pondAfterImage,
    source: 'Illustrative visual',
    lastObserved: '08 Oct 2026',
    comparison: 'Mar 2022 – Mar 2024',
    clearCoverage: '86%',
    reviewNote: 'Possible reduction in visible water area requires field verification.',
  },
  {
    id: 'pond-b',
    name: 'Pond B',
    location: 'Savar',
    area: '7.8 ha',
    change: 2.3,
    status: 'no_change',
    coordinates: [23.8583, 90.2667],
    image: pondBeforeImage,
    beforeImage: pondBeforeImage,
    afterImage: pondAfterImage,
    source: 'Illustrative visual',
    lastObserved: '06 Oct 2026',
    comparison: 'Feb 2023 – Feb 2025',
    clearCoverage: '91%',
    reviewNote: 'Visible water area remains within the expected seasonal range.',
  },
  {
    id: 'wetland-c',
    name: 'Wetland C',
    location: 'Dhaka',
    area: '14.2 ha',
    change: null,
    status: 'insufficient_data',
    coordinates: [23.7947, 90.4019],
    image: pondAfterImage,
    beforeImage: pondBeforeImage,
    afterImage: pondAfterImage,
    source: 'Illustrative visual',
    lastObserved: '04 Oct 2026',
    comparison: 'Apr 2022 – Apr 2025',
    clearCoverage: '42%',
    reviewNote: 'Cloud and shadow coverage prevent a reliable comparison.',
  },
  {
    id: 'lake-d',
    name: 'Lake D',
    location: 'Narayanganj',
    area: '11.6 ha',
    change: 1.5,
    status: 'no_change',
    coordinates: [23.6238, 90.5],
    image: pondBeforeImage,
    beforeImage: pondBeforeImage,
    afterImage: pondAfterImage,
    source: 'Illustrative visual',
    lastObserved: '02 Oct 2026',
    comparison: 'Jan 2023 – Jan 2025',
    clearCoverage: '89%',
    reviewNote: 'No material change is visible in the selected comparison.',
  },
  {
    id: 'beel-e',
    name: 'Beel E',
    location: 'Gazipur',
    area: '18.1 ha',
    change: -8.4,
    status: 'needs_review',
    coordinates: [24.0608, 90.3976],
    image: pondAfterImage,
    beforeImage: pondBeforeImage,
    afterImage: pondAfterImage,
    source: 'Illustrative visual',
    lastObserved: '30 Sep 2026',
    comparison: 'Mar 2022 – Mar 2024',
    clearCoverage: '82%',
    reviewNote: 'A smaller possible change requires a site visit before classification.',
  },
]

export const dashboardTasks = [
  {
    id: 'TL-104', title: 'Verify water-area change', description: 'Visit Pond A and verify the possible reduction using geotagged field evidence.', site: 'Pond A', siteId: 'pond-a', assignee: 'Rahim Uddin', initials: 'RU', due: 'Today', dueDate: '2026-10-09', status: 'review_pending', priority: 'High', estimatedCost: 6500, actualCost: 0, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-08T09:00:00.000Z', notifications: { email: true, calendar: true, whatsapp: true }, comments: [], activityHistory: [{ id: 'history-104-1', action: 'Task created from Pond A observation', actor: 'Nusrat Jahan', time: '08 Oct 2026' }],
  },
  {
    id: 'TL-103', title: 'Upload site visit evidence', description: 'Organize photographs and field notes from the latest Beel E visit.', site: 'Beel E', siteId: 'beel-e', assignee: 'Sadia Akter', initials: 'SA', due: 'Tomorrow', dueDate: '2026-10-10', status: 'in_progress', priority: 'Medium', estimatedCost: 3200, actualCost: 1800, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-06T08:30:00.000Z', notifications: { email: true, calendar: false, whatsapp: false }, comments: [{ id: 'comment-103-1', author: 'Sadia Akter', text: 'Field photographs received and awaiting final labels.', time: '08 Oct 2026' }], activityHistory: [{ id: 'history-103-1', action: 'Status changed to In progress', actor: 'Sadia Akter', time: '07 Oct 2026' }],
  },
  {
    id: 'TL-102', title: 'Review cloud coverage', description: 'Check whether the available imagery is sufficient for a defensible comparison.', site: 'Wetland C', siteId: 'wetland-c', assignee: 'Tanvir Hasan', initials: 'TH', due: '12 Oct', dueDate: '2026-10-12', status: 'approved', priority: 'Medium', estimatedCost: 2400, actualCost: 0, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-05T10:15:00.000Z', notifications: { email: true, calendar: true, whatsapp: false }, comments: [], activityHistory: [{ id: 'history-102-1', action: 'Task approved for technical review', actor: 'Nusrat Jahan', time: '06 Oct 2026' }],
  },
  {
    id: 'TL-101', title: 'Validate seasonal comparison', description: 'Confirm that both Lake D observations represent a comparable seasonal window.', site: 'Lake D', siteId: 'lake-d', assignee: 'Rahim Uddin', initials: 'RU', due: '14 Oct', dueDate: '2026-10-14', status: 'review_pending', priority: 'Low', estimatedCost: 1800, actualCost: 0, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-04T07:45:00.000Z', notifications: { email: false, calendar: true, whatsapp: false }, comments: [], activityHistory: [{ id: 'history-101-1', action: 'Task created for seasonal validation', actor: 'Nusrat Jahan', time: '04 Oct 2026' }],
  },
  {
    id: 'TL-100', title: 'Complete Pond B inspection', description: 'Record the routine field inspection and attach the completion note.', site: 'Pond B', siteId: 'pond-b', assignee: 'Rahim Uddin', initials: 'RU', due: '05 Oct', dueDate: '2026-10-05', status: 'reported_complete', priority: 'Low', estimatedCost: 2800, actualCost: 2600, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-01T08:00:00.000Z', notifications: { email: true, calendar: true, whatsapp: false }, comments: [{ id: 'comment-100-1', author: 'Rahim Uddin', text: 'Inspection completed; no immediate intervention required.', time: '05 Oct 2026' }], activityHistory: [{ id: 'history-100-1', action: 'Completion reported with field note', actor: 'Rahim Uddin', time: '05 Oct 2026' }],
  },
  {
    id: 'TL-099', title: 'Confirm boundary reference points', description: 'Review the recorded boundary points before the next comparison is approved.', site: 'Beel E', siteId: 'beel-e', assignee: 'Sadia Akter', initials: 'SA', due: '07 Oct', dueDate: '2026-10-07', status: 'approved', priority: 'High', estimatedCost: 2100, actualCost: 0, assignedBy: 'Nusrat Jahan', createdAt: '2026-10-02T11:30:00.000Z', notifications: { email: true, calendar: true, whatsapp: true }, comments: [], activityHistory: [{ id: 'history-099-1', action: 'Task approved and assigned', actor: 'Nusrat Jahan', time: '03 Oct 2026' }],
  },
]

export const dashboardActivities = [
  { id: 'activity-1', type: 'complete', title: 'Task marked complete', detail: 'Rahim completed the Pond B field inspection.', time: '18 min ago', unread: true },
  { id: 'activity-2', type: 'expense', title: 'Expense recorded', detail: '৳4,200 added to Pond A inspection.', time: '1 hr ago', unread: true },
  { id: 'activity-3', type: 'comment', title: 'New review note', detail: 'Sadia added a note to Wetland C.', time: '3 hrs ago', unread: false },
  { id: 'activity-4', type: 'notification', title: 'Reminder delivered', detail: 'Task deadline email sent to coordinator.', time: 'Yesterday', unread: false },
  { id: 'activity-5', type: 'report', title: 'Report generated', detail: 'September monitoring summary was prepared.', time: '2 days ago', unread: false },
]

export const trendData = {
  '7 days': [
    { date: '03 Oct', reviewed: 2, tasks: 1 }, { date: '04 Oct', reviewed: 3, tasks: 2 },
    { date: '05 Oct', reviewed: 3, tasks: 2 }, { date: '06 Oct', reviewed: 5, tasks: 3 },
    { date: '07 Oct', reviewed: 6, tasks: 4 }, { date: '08 Oct', reviewed: 8, tasks: 5 },
    { date: '09 Oct', reviewed: 9, tasks: 7 },
  ],
  '30 days': [
    { date: 'Week 1', reviewed: 5, tasks: 3 }, { date: 'Week 2', reviewed: 9, tasks: 6 },
    { date: 'Week 3', reviewed: 13, tasks: 9 }, { date: 'Week 4', reviewed: 18, tasks: 12 },
  ],
  '90 days': [
    { date: 'July', reviewed: 12, tasks: 8 }, { date: 'August', reviewed: 24, tasks: 17 },
    { date: 'September', reviewed: 39, tasks: 28 }, { date: 'October', reviewed: 48, tasks: 35 },
  ],
}

export const budgetSummary = {
  total: 45000,
  spent: 18200,
  pending: 5300,
}
