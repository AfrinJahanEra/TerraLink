import {
  BotMessageSquare,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MapPinned,
  PlugZap,
  Satellite,
  Users,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Overview', items: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Wetland map', path: '/map', icon: MapPinned },
    { label: 'Change analysis', path: '/sites/pond-a', icon: Satellite },
  ] },
  { label: 'Operations', items: [
    { label: 'Review & tasks', path: '/tasks', icon: ClipboardCheck },
    { label: 'Team', path: '/team', icon: Users },
    { label: 'Budget & costs', path: '/budget', icon: ChartNoAxesCombined },
  ] },
  { label: 'Insights', items: [
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Bangla assistant', path: '/assistant', icon: BotMessageSquare },
    { label: 'Integrations', path: '/integrations', icon: PlugZap, roles: ['manager'] },
  ] },
]

export const FLAT_NAV_ITEMS = NAV_ITEMS.flatMap((group) => group.items)

export function getNavigationForRole(roleId) {
  return NAV_ITEMS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(roleId)),
  })).filter((group) => group.items.length)
}

export function getPageTitle(pathname) {
  if (pathname.startsWith('/sites/')) return 'Change analysis'
  return FLAT_NAV_ITEMS.find((item) => item.path === pathname)?.label ?? 'TerraLink'
}
