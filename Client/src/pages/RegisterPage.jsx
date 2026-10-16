import { Navigate } from 'react-router-dom'
import { AuthShell } from '../components/login/AuthShell'
import { useAuthRedirect } from '../hooks/useAuthRedirect'

export function RegisterPage() {
  const { selected, setSelected, finish, query, redirectTo } = useAuthRedirect()
  if (redirectTo) return <Navigate to={redirectTo} replace />

  return <AuthShell mode="register" role={selected} onRoleChange={setSelected} onSubmit={finish} alternateTo={`/login${query}`} />
}
