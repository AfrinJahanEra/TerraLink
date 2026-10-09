import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AppProvider } from './context/AppContext'
import { useApp } from './hooks/useApp'
import { LoginPage } from './pages/LoginPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const MapPage = lazy(() => import('./pages/MapPage').then((module) => ({ default: module.MapPage })))
const ModulePage = lazy(() => import('./pages/ModulePage').then((module) => ({ default: module.ModulePage })))

function ProtectedLayout() {
  const { role } = useApp()
  return role ? <AppLayout /> : <Navigate to="/login" replace />
}

function IntegrationsRoute() {
  const { role } = useApp()
  return role?.id === 'manager' ? <ModulePage type="integrations" /> : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { role } = useApp()

  return (
    <Suspense fallback={<div role="status" className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">Loading workspace...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/sites/:siteId" element={<ModulePage type="analysis" />} />
          <Route path="/tasks" element={<ModulePage type="tasks" />} />
          <Route path="/team" element={<ModulePage type="team" />} />
          <Route path="/budget" element={<ModulePage type="budget" />} />
          <Route path="/reports" element={<ModulePage type="reports" />} />
          <Route path="/assistant" element={<ModulePage type="assistant" />} />
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
