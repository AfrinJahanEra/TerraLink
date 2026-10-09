import {
  BotMessageSquare,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  History,
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

export const NAV_ITEMS = [
  { label: 'Overview', items: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ] },
  { label: 'Monitoring', items: [
    { label: 'Wetland map', path: '/map', icon: MapPinned },
    { label: 'Sites register', path: '/sites', icon: TableProperties },
    { label: 'Change analysis', path: '/sites/pond-a', matchPrefix: '/sites/', icon: Satellite },
    { label: 'Review queue', path: '/reviews', icon: ListChecks },
  ] },
  { label: 'Field operations', items: [
    { label: 'Tasks', path: '/tasks', icon: ClipboardCheck },
    { label: 'Schedule & meetings', path: '/schedule', icon: CalendarDays },
  ] },
  { label: 'Finance', items: [
    { label: 'Budgets', path: '/budget', icon: ChartNoAxesCombined },
    { label: 'Expenses', path: '/expenses', icon: ReceiptText },
  ] },
  { label: 'People', items: [
    { label: 'Team', path: '/team', icon: Users },
  ] },
  { label: 'Reporting', items: [
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Bangla assistant', path: '/assistant', icon: BotMessageSquare },
  ] },
  { label: 'Administration', items: [
    { label: 'Communications', path: '/communications', icon: Megaphone, roles: ['manager', 'operator'] },
    { label: 'Audit trail', path: '/audit', icon: History, roles: ['manager', 'operator'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['manager'] },
  ] },
]

export const FLAT_NAV_ITEMS = NAV_ITEMS.flatMap((group) => group.items)

export function canAccessPath(roleId, path) {
  const item = FLAT_NAV_ITEMS.find((entry) => entry.path === path)
  return !item?.roles || item.roles.includes(roleId)
}

export function getNavigationForRole(roleId) {
  return NAV_ITEMS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(roleId)),
  })).filter((group) => group.items.length)
}

export function isNavItemActive(item, pathname) {
  return item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname === item.path
}

export function getPageTitle(pathname) {
  const exact = FLAT_NAV_ITEMS.find((item) => item.path === pathname && !item.matchPrefix)
  if (exact) return exact.label
  if (pathname.startsWith('/sites/')) return 'Change analysis'
  return 'TerraLink'
}
