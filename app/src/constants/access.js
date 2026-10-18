/**
 * What each workspace role can see and do. Navigation, route guards, page content, buttons and the
 * state functions all read from this one table, so a role never sees or does something it should not.
 *
 * "Own" permissions (marked in comments) also require the task to be assigned to the person.
 */
const MANAGER = 'manager'
const COORDINATOR = 'coordinator'

export const PERMISSIONS = {
  // Pages
  'dashboard.view': [MANAGER, COORDINATOR],
  'map.view': [MANAGER, COORDINATOR], // coordinator sees assigned sites only
  'sites.register': [MANAGER],
  'sites.review': [MANAGER],
  'sites.assigned': [COORDINATOR], // read-only record of a site they have a task at
  'measurement.run': [MANAGER],
  'community.view': [MANAGER],
  'tasks.view': [MANAGER, COORDINATOR], // coordinator sees own tasks only
  'budget.view': [MANAGER],
  'team.view': [MANAGER],
  'reports.view': [MANAGER],
  'assistant.use': [MANAGER, COORDINATOR],

  // Actions
  'tasks.create': [MANAGER],
  'tasks.assign': [MANAGER], // assignee, deadline, estimate, notification choices
  'tasks.progress': [COORDINATOR], // start, block, submit completion; own tasks only. Never the manager, who reviews it
  'tasks.review': [MANAGER], // approve completion, return for more work
  'tasks.cancel': [MANAGER],
  'tasks.comment': [MANAGER, COORDINATOR], // coordinator on own tasks only
  'tasks.remind': [MANAGER],
  'expenses.add': [MANAGER, COORDINATOR], // coordinator on own tasks only
  'expenses.approve': [MANAGER],
  'budget.edit': [MANAGER],
  'sites.decide': [MANAGER],
  'sites.add': [MANAGER], // add a new water body to the register
  'measurement.save': [MANAGER],
  'community.review': [MANAGER],
  'schedule.manage': [MANAGER], // create Google Calendar meetings with a Meet link
  'team.manage': [MANAGER],
  'reports.share': [MANAGER],
  'workspace.reset': [MANAGER], // restore the sample data, from the account menu
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
      'Manage the team, send reports by email, and reset the sample data',
    ],
    cannot: [
      'Do the field work. Starting, blocking and submitting a task belongs to its assignee, so the person who approves is never the person who did the work',
      'Assign a task to anyone who is not a field coordinator',
      'Submit community reports. Those come from users.',
    ],
  },
  coordinator: {
    headline: 'Does the field work on assigned tasks',
    can: [
      'See and work on the tasks assigned to you, and the sites they are at',
      'Start work, mark a task blocked, and submit completion photos for review',
      'Record expenses on your own tasks; the project manager approves them',
      'Ask TerraLink Copilot about your tasks, budget and any lake',
    ],
    cannot: [
      'Create, assign or reassign tasks, or see anyone else’s tasks',
      'Close a task, approve expenses or work, verify reports or record site decisions',
      'See budgets, the team directory or programme reports',
    ],
  },
}
