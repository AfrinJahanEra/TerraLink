export const integrationRules = [
  { id: 'taskAssignedEmail', service: 'email', label: 'Task assignment', description: 'Email the assigned team member.' },
  { id: 'overBudgetEmail', service: 'email', label: 'Budget overrun', description: 'Email the project manager when a site crosses its plan.' },
  { id: 'taskCompleteEmail', service: 'email', label: 'Reported complete', description: 'Email the project manager when field work is completed.' },
  { id: 'taskAssignedCalendar', service: 'calendar', label: 'Task deadline', description: 'Create a deadline event with a one-day reminder when connected.' },
  { id: 'taskAssignedWhatsapp', service: 'whatsapp', label: 'Task assignment', description: 'Prepare a click-to-chat message for the assignee.' },
  { id: 'taskCompleteWhatsapp', service: 'whatsapp', label: 'Reported complete', description: 'Prepare a completion message for the project manager.' },
  { id: 'overdueWhatsapp', service: 'whatsapp', label: 'Overdue reminder', description: 'Prepare a reminder for overdue task owners.' },
]

export const defaultIntegrationSettings = {
  language: 'en',
  rules: Object.fromEntries(integrationRules.map((rule) => [rule.id, true])),
}

export const ORGANIZATION_PROFILE = {
  name: 'TerraLink Wetland Programme',
  partner: 'TerraLink field monitoring unit',
  office: 'Project office, Dhaka',
  timeZone: 'Asia/Dhaka (UTC+06:00)',
  workWeek: 'Sunday – Thursday',
  currency: 'Bangladeshi taka (BDT)',
}
