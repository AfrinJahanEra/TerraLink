import { ClipboardCheck, ShieldCheck, UserCog } from 'lucide-react'

export const ROLES = {
  manager: {
    id: 'manager',
    label: 'Project Manager',
    description: 'Review changes, approve work, monitor budgets and reports.',
    icon: ShieldCheck,
    primary: true,
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
    capabilities: [
      'Maintain task and team records',
      'Enter evidence and expense records',
      'Prepare programme reports',
    ],
    user: { name: 'Sadia Akter', email: 'operator@terralink.demo' },
  },
}

export const ROLE_LIST = Object.values(ROLES)
