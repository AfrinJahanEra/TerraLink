import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AppProvider } from './context/AppContext'
import { useApp } from './hooks/useApp'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModulePage } from './pages/ModulePage'

function ProtectedLayout() {
  const { role } = useApp()
  return role ? <AppLayout /> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { role } = useApp()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/map" element={<ModulePage type="map" />} />
        <Route path="/sites/:siteId" element={<ModulePage type="analysis" />} />
        <Route path="/tasks" element={<ModulePage type="tasks" />} />
        <Route path="/team" element={<ModulePage type="team" />} />
        <Route path="/budget" element={<ModulePage type="budget" />} />
        <Route path="/reports" element={<ModulePage type="reports" />} />
        <Route path="/assistant" element={<ModulePage type="assistant" />} />
        <Route path="/integrations" element={<ModulePage type="integrations" />} />
      </Route>
      <Route path="*" element={<Navigate to={role ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
