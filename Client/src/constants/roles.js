import { ClipboardCheck, ShieldCheck, UserCog } from 'lucide-react'

export const ROLES = {
  manager: {
    id: 'manager',
    label: 'Project Manager',
    description: 'Review changes, approve work, monitor budgets and reports.',
    icon: ShieldCheck,
    primary: true,
    user: { name: 'Nusrat Jahan', email: 'manager@terralink.demo' },
  },
  coordinator: {
    id: 'coordinator',
    label: 'Field Coordinator',
    description: 'Update assigned tasks, add inspection notes and record actual costs.',
    icon: ClipboardCheck,
    user: { name: 'Rahim Uddin', email: 'coordinator@terralink.demo' },
  },
  operator: {
    id: 'operator',
    label: 'Office Operator',
    description: 'Keep task, team and expense records on behalf of the field team.',
    icon: UserCog,
    user: { name: 'Sadia Akter', email: 'operator@terralink.demo' },
  },
}

export const ROLE_LIST = Object.values(ROLES)
