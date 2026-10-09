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
    source: 'Illustrative visual',
  },
  {
    id: 'pond-b',
    name: 'Pond B',
    location: 'Savar',
    area: '7.8 ha',
    change: 2.3,
    status: 'stable',
    coordinates: [23.8583, 90.2667],
    image: pondBeforeImage,
    source: 'Illustrative visual',
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
    source: 'Illustrative visual',
  },
  {
    id: 'lake-d',
    name: 'Lake D',
    location: 'Narayanganj',
    area: '11.6 ha',
    change: 1.5,
    status: 'stable',
    coordinates: [23.6238, 90.5],
    image: pondBeforeImage,
    source: 'Illustrative visual',
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
    source: 'Illustrative visual',
  },
]

export const dashboardTasks = [
  { id: 'TL-104', title: 'Verify water-area change', site: 'Pond A', assignee: 'Rahim Uddin', initials: 'RU', due: 'Today', status: 'review_pending' },
  { id: 'TL-103', title: 'Upload site visit evidence', site: 'Beel E', assignee: 'Sadia Akter', initials: 'SA', due: 'Tomorrow', status: 'in_progress' },
  { id: 'TL-102', title: 'Review cloud coverage', site: 'Wetland C', assignee: 'Tanvir Hasan', initials: 'TH', due: '12 Oct', status: 'approved' },
  { id: 'TL-101', title: 'Validate seasonal comparison', site: 'Lake D', assignee: 'Farzana Islam', initials: 'FI', due: '14 Oct', status: 'review_pending' },
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

export const integrationStatus = [
  { id: 'email', name: 'Email', detail: 'EmailJS delivery ready', state: 'ready' },
  { id: 'calendar', name: 'Calendar', detail: 'Google Calendar setup pending', state: 'pending' },
  { id: 'whatsapp', name: 'WhatsApp', detail: 'Click-to-chat ready', state: 'ready' },
]
