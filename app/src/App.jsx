import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PublicLayout } from './components/layout/PublicLayout'
import { PageSkeleton } from './components/ui/PageSkeleton'
import { homePathFor } from './constants/roles'
import { AppProvider } from './context/AppContext'
import { useApp } from './hooks/useApp'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'

function page(loader, name) {
  return lazy(() => loader().then((module) => ({ default: module[name] })))
}

const RegisterPage = page(() => import('./pages/RegisterPage'), 'RegisterPage')
const DashboardPage = page(() => import('./pages/DashboardPage'), 'DashboardPage')
const ExplorePage = page(() => import('./pages/ExplorePage'), 'ExplorePage')
const PublicPondPage = page(() => import('./pages/PublicPondPage'), 'PublicPondPage')
const ReportIssuePage = page(() => import('./pages/ReportIssuePage'), 'ReportIssuePage')
const MyReportsPage = page(() => import('./pages/MyReportsPage'), 'MyReportsPage')
const CommunityReportsPage = page(() => import('./pages/CommunityReportsPage'), 'CommunityReportsPage')
const ComparePage = page(() => import('./pages/ComparePage'), 'ComparePage')
const MapPage = page(() => import('./pages/MapPage'), 'MapPage')
const SitesRegisterPage = page(() => import('./pages/SitesRegisterPage'), 'SitesRegisterPage')
const SiteDetailsPage = page(() => import('./pages/SiteDetailsPage'), 'SiteDetailsPage')
const TasksPage = page(() => import('./pages/TasksPage'), 'TasksPage')
const BudgetPage = page(() => import('./pages/BudgetPage'), 'BudgetPage')
const TeamPage = page(() => import('./pages/TeamPage'), 'TeamPage')
const ReportPage = page(() => import('./pages/ReportPage'), 'ReportPage')
const AssistantPage = page(() => import('./pages/AssistantPage'), 'AssistantPage')

function ActionRedirect() {
  const { taskId } = useParams()
  return <Navigate to={taskId ? `/tasks?task=${taskId}` : '/tasks'} replace />
}

function ProtectedLayout() {
  const { role } = useApp()
  if (!role) return <Navigate to="/login" replace />
  // Users have no staff workspace; they work from the community pages.
  return role.staff ? <AppLayout /> : <Navigate to={homePathFor(role.id)} replace />
}

/** The community pages belong to users and visitors; signed-in staff stay in their workspace. */
function UserSideLayout() {
  const { role } = useApp()
  return role?.staff ? <Navigate to={homePathFor(role.id)} replace /> : <PublicLayout />
}

function AppRoutes() {
  const { role } = useApp()

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<UserSideLayout />}>
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/:siteId" element={<PublicPondPage />} />
          <Route path="/report" element={<ReportIssuePage />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/sites" element={<SitesRegisterPage />} />
          <Route path="/sites/:siteId" element={<SiteDetailsPage />} />
          <Route path="/compare/:siteId" element={<ComparePage />} />
          <Route path="/reviews" element={<Navigate to="/community" replace />} />
          <Route path="/community" element={<CommunityReportsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/actions" element={<ActionRedirect />} />
          <Route path="/actions/:taskId" element={<ActionRedirect />} />
          <Route path="/schedule" element={<Navigate to="/tasks" replace />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/expenses" element={<Navigate to="/budget#ledger" replace />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
        </Route>
        <Route path="*" element={<Navigate to={role ? homePathFor(role.id) : '/login'} replace />} />
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
