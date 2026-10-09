import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PageSkeleton } from './components/ui/PageSkeleton'
import { AppProvider } from './context/AppContext'
import { useApp } from './hooks/useApp'
import { LoginPage } from './pages/LoginPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const MapPage = lazy(() => import('./pages/MapPage').then((module) => ({ default: module.MapPage })))
const SiteDetailsPage = lazy(() => import('./pages/SiteDetailsPage').then((module) => ({ default: module.SiteDetailsPage })))
const TasksPage = lazy(() => import('./pages/TasksPage').then((module) => ({ default: module.TasksPage })))
const TeamPage = lazy(() => import('./pages/TeamPage').then((module) => ({ default: module.TeamPage })))
const BudgetPage = lazy(() => import('./pages/BudgetPage').then((module) => ({ default: module.BudgetPage })))
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage').then((module) => ({ default: module.IntegrationsPage })))
const ReportPage = lazy(() => import('./pages/ReportPage').then((module) => ({ default: module.ReportPage })))
const AssistantPage = lazy(() => import('./pages/AssistantPage').then((module) => ({ default: module.AssistantPage })))

function ProtectedLayout() {
  const { role } = useApp()
  return role ? <AppLayout /> : <Navigate to="/login" replace />
}

function IntegrationsRoute() {
  const { role } = useApp()
  return role?.id === 'manager' ? <IntegrationsPage /> : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { role } = useApp()

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/sites/:siteId" element={<SiteDetailsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/integrations" element={<IntegrationsRoute />} />
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
