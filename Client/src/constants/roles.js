import { ClipboardCheck, ShieldCheck, UserCog, UserRound } from 'lucide-react'

export const ROLES = {
  manager: {
    id: 'manager',
    label: 'Project Manager',
    description: 'Review changes, approve work, monitor budgets and reports.',
    icon: ShieldCheck,
    primary: true,
    staff: true,
    capabilities: [
      'Review and approve monitoring findings',
      'Assign work and monitor delivery',
      'Manage budgets, schedules, reports, and settings',
    ],
    user: { name: 'Nusrat Jahan', email: 'manager@terralink.demo' },
  },
  coordinator: {
    id: 'coordinator',
    label: 'Field Coordinator',
    description: 'Update assigned tasks, add inspection notes and record actual costs.',
    icon: ClipboardCheck,
    staff: true,
    capabilities: [
      'Access assigned sites and field tasks',
      'Add evidence and progress updates',
      'Record actual field expenses',
    ],
    user: { name: 'Rahim Uddin', email: 'coordinator@terralink.demo' },
  },
  operator: {
    id: 'operator',
    label: 'Office Operator',
    description: 'Keep task, team and expense records on behalf of the field team.',
    icon: UserCog,
    staff: true,
    capabilities: [
      'Maintain task and team records',
      'Enter evidence and expense records',
      'Prepare programme reports',
    ],
    user: { name: 'Sadia Akter', email: 'operator@terralink.demo' },
  },
  user: {
    id: 'user',
    label: 'User',
    description: 'Explore the water bodies and report problems with photos.',
    icon: UserRound,
    staff: false,
    capabilities: [
      'Explore monitored water bodies on the map',
      'Submit photo reports with a location',
      'Follow the review status of your reports',
    ],
    user: { name: 'Karim Hossain', email: 'user@terralink.demo' },
  },
}

export const ROLE_LIST = Object.values(ROLES)

/** Where a signed-in role lands: staff use the workspace, users use the community pages. */
export function homePathFor(roleId) {
  return ROLES[roleId]?.staff === false ? '/explore' : '/dashboard'
}

/** Accepts only in-app paths so a `next` query parameter cannot send someone to another site. */
export function safeNextPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null
}
