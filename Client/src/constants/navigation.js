import {
  BotMessageSquare,
  CalendarDays,
  Camera,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  History,
  Layers,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Megaphone,
  ReceiptText,
  Satellite,
  Settings,
  TableProperties,
  Users,
} from 'lucide-react'
import { can } from './access'

/** Each item is shown to a role only when it holds the item's permission. */
export const NAV_ITEMS = [
  { label: 'Overview', items: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  ] },
  { label: 'Monitoring', items: [
    { label: 'Wetland map', path: '/map', icon: MapPinned, permission: 'map.view' },
    { label: 'Sites register', path: '/sites', icon: TableProperties, permission: 'sites.register' },
    { label: 'Site review', path: '/sites/gulshan-baridhara-lake', matchPrefix: '/sites/', icon: Satellite, permission: 'sites.review' },
    { label: 'Satellite comparison', path: '/compare/hatirjheel', matchPrefix: '/compare/', icon: Layers, permission: 'measurement.run' },
    { label: 'Community reports', path: '/community', icon: Camera, permission: 'community.view' },
    { label: 'Review queue', path: '/reviews', icon: ListChecks, permission: 'reviews.view' },
  ] },
  { label: 'Field operations', items: [
    { label: 'Tasks', path: '/tasks', icon: ClipboardCheck, permission: 'tasks.view' },
    { label: 'Schedule & meetings', path: '/schedule', icon: CalendarDays, permission: 'schedule.view' },
  ] },
  { label: 'Finance', items: [
    { label: 'Budgets', path: '/budget', icon: ChartNoAxesCombined, permission: 'budget.view' },
    { label: 'Expenses', path: '/expenses', icon: ReceiptText, permission: 'expenses.view' },
  ] },
  { label: 'People', items: [
    { label: 'Team', path: '/team', icon: Users, permission: 'team.view' },
  ] },
  { label: 'Reporting', items: [
    { label: 'Reports', path: '/reports', icon: FileText, permission: 'reports.view' },
    { label: 'Bangla assistant', path: '/assistant', icon: BotMessageSquare, permission: 'assistant.use' },
  ] },
  { label: 'Administration', items: [
    { label: 'Communications', path: '/communications', icon: Megaphone, permission: 'comms.view' },
    { label: 'Audit trail', path: '/audit', icon: History, permission: 'audit.view' },
    { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.manage' },
  ] },
]

export const FLAT_NAV_ITEMS = NAV_ITEMS.flatMap((group) => group.items)

function itemForPath(path) {
  return FLAT_NAV_ITEMS.find((entry) => entry.path === path || (entry.matchPrefix && path.startsWith(entry.matchPrefix)))
}

/** The page behind a path, or undefined for paths that are not workspace pages (redirects, unknown). */
export function pageForPath(path) {
  return itemForPath(path)
}

export function canAccessPath(roleId, path) {
  const item = itemForPath(path)
  if (!item) return true
  // A coordinator may open the read-only record of a site they have a task at, reached from the task.
  if (item.matchPrefix === '/sites/' && can(roleId, 'sites.assigned')) return true
  return can(roleId, item.permission)
}

export function getNavigationForRole(roleId) {
  return NAV_ITEMS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(roleId, item.permission)),
  })).filter((group) => group.items.length)
}

export function isNavItemActive(item, pathname) {
  return item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname === item.path
}

export function getPageTitle(pathname) {
  const exact = FLAT_NAV_ITEMS.find((item) => item.path === pathname && !item.matchPrefix)
  if (exact) return exact.label
  if (pathname.startsWith('/sites/')) return 'Site review'
  if (pathname.startsWith('/compare/')) return 'Satellite comparison'
  return 'TerraLink'
}
