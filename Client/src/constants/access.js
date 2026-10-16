/**
 * What each workspace role can see and do. Navigation, route guards, page content, buttons and the
 * state functions all read from this one table, so a role never sees or does something it should not.
 *
 * "Own" permissions (marked in comments) also require the task to be assigned to the person.
 */
const MANAGER = 'manager'
const COORDINATOR = 'coordinator'
const OPERATOR = 'operator'

export const PERMISSIONS = {
  // Pages
  'dashboard.view': [MANAGER, COORDINATOR, OPERATOR],
  'map.view': [MANAGER, COORDINATOR, OPERATOR], // coordinator sees assigned sites only
  'sites.register': [MANAGER, OPERATOR],
  'sites.review': [MANAGER, OPERATOR],
  'sites.assigned': [COORDINATOR], // read-only record of a site they have a task at
  'measurement.run': [MANAGER, OPERATOR],
  'community.view': [MANAGER, OPERATOR],
  'reviews.view': [MANAGER, OPERATOR],
  'tasks.view': [MANAGER, COORDINATOR, OPERATOR], // coordinator sees own tasks only
  'schedule.view': [MANAGER, COORDINATOR, OPERATOR], // coordinator sees meetings they attend
  'budget.view': [MANAGER, OPERATOR],
  'expenses.view': [MANAGER, COORDINATOR, OPERATOR], // coordinator sees expenses on own tasks
  'team.view': [MANAGER, OPERATOR],
  'reports.view': [MANAGER, OPERATOR],
  'assistant.use': [MANAGER, COORDINATOR, OPERATOR],
  'comms.view': [MANAGER, OPERATOR],
  'audit.view': [MANAGER, OPERATOR],
  'settings.manage': [MANAGER],

  // Actions
  'tasks.create': [MANAGER],
  'tasks.assign': [MANAGER], // assignee, deadline, estimate, notification choices
  'tasks.progress': [MANAGER, COORDINATOR], // start, block, submit completion; coordinator on own tasks only
  'tasks.review': [MANAGER], // approve completion, return for more work
  'tasks.cancel': [MANAGER],
  'tasks.comment': [MANAGER, COORDINATOR, OPERATOR], // coordinator on own tasks only
  'tasks.remind': [MANAGER, OPERATOR],
  'expenses.add': [MANAGER, COORDINATOR, OPERATOR], // coordinator on own tasks only
  'expenses.approve': [MANAGER],
  'budget.edit': [MANAGER],
  'sites.decide': [MANAGER],
  'measurement.save': [MANAGER, OPERATOR],
  'community.review': [MANAGER],
  'schedule.manage': [MANAGER, OPERATOR],
  'team.manage': [MANAGER, OPERATOR],
  'reports.share': [MANAGER, OPERATOR],
}

export function can(roleId, permission) {
  return Boolean(PERMISSIONS[permission]?.includes(roleId))
}

/** Plain-language summary shown in the "My role and access" panel. Keep it in step with PERMISSIONS above. */
export const ROLE_ACCESS = {
  manager: {
    headline: 'Decides, assigns and approves',
    can: [
      'Review satellite evidence and record a decision for each site',
      'Verify or reject community reports',
      'Create tasks and assign or reassign them',
      'Approve finished work and close tasks, or send it back',
      'Approve or reject expenses and edit budget allocations',
      'Manage the team, settings, integrations, and see communications and the audit trail',
    ],
    cannot: ['Submit community reports. Those come from users.'],
  },
  coordinator: {
    headline: 'Does the field work on assigned tasks',
    can: [
      'See and work on the tasks assigned to you, and the sites they are at',
      'Start work, mark a task blocked, and submit completion photos for review',
      'Record expenses on your own tasks; the project manager approves them',
      'See your own schedule and ask the Bangla assistant about your tasks',
    ],
    cannot: [
      'Create, assign or reassign tasks, or see anyone else’s tasks',
      'Close a task, approve expenses or work, verify reports or record site decisions',
      'See budgets, the team directory, programme reports, communications, the audit trail or settings',
    ],
  },
  operator: {
    headline: 'Keeps the records and the paperwork',
    can: [
      'See every site, task, community report and cost, read-only',
      'Run satellite comparisons and save measurements to the site record',
      'Add notes and record expenses on any task; send reminders',
      'Schedule meetings and field visits and keep team records',
      'Generate and share programme reports; see communications and the audit trail',
    ],
    cannot: [
      'Create, assign or reassign tasks, change their status or close them',
      'Verify reports, record site decisions, approve expenses or edit budgets',
      'Open settings',
    ],
  },
}
