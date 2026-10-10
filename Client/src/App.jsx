import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PageSkeleton } from './components/ui/PageSkeleton'
import { canAccessPath } from './constants/navigation'
import { AppProvider } from './context/AppContext'
import { useApp } from './hooks/useApp'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'

function page(loader, name) {
  return lazy(() => loader().then((module) => ({ default: module[name] })))
}

const RegisterPage = page(() => import('./pages/RegisterPage'), 'RegisterPage')
const DashboardPage = page(() => import('./pages/DashboardPage'), 'DashboardPage')
const MapPage = page(() => import('./pages/MapPage'), 'MapPage')
const SitesRegisterPage = page(() => import('./pages/SitesRegisterPage'), 'SitesRegisterPage')
const SiteDetailsPage = page(() => import('./pages/SiteDetailsPage'), 'SiteDetailsPage')
const ReviewQueuePage = page(() => import('./pages/ReviewQueuePage'), 'ReviewQueuePage')
const TasksPage = page(() => import('./pages/TasksPage'), 'TasksPage')
const SchedulePage = page(() => import('./pages/SchedulePage'), 'SchedulePage')
const BudgetPage = page(() => import('./pages/BudgetPage'), 'BudgetPage')
const ExpensesPage = page(() => import('./pages/ExpensesPage'), 'ExpensesPage')
const TeamPage = page(() => import('./pages/TeamPage'), 'TeamPage')
const ReportPage = page(() => import('./pages/ReportPage'), 'ReportPage')
const AssistantPage = page(() => import('./pages/AssistantPage'), 'AssistantPage')
const CommunicationsPage = page(() => import('./pages/CommunicationsPage'), 'CommunicationsPage')
const AuditTrailPage = page(() => import('./pages/AuditTrailPage'), 'AuditTrailPage')
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage')

function ProtectedLayout() {
  const { role } = useApp()
  return role ? <AppLayout /> : <Navigate to="/login" replace />
}

function RoleRoute({ path, children }) {
  const { role } = useApp()
  return canAccessPath(role?.id, path) ? children : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { role } = useApp()

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/sites" element={<SitesRegisterPage />} />
          <Route path="/sites/:siteId" element={<SiteDetailsPage />} />
          <Route path="/reviews" element={<ReviewQueuePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/communications" element={<RoleRoute path="/communications"><CommunicationsPage /></RoleRoute>} />
          <Route path="/audit" element={<RoleRoute path="/audit"><AuditTrailPage /></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute path="/settings"><SettingsPage /></RoleRoute>} />
          <Route path="/integrations" element={<Navigate to="/settings?tab=services" replace />} />
        </Route>
        <Route path="*" element={<Navigate to={role ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
