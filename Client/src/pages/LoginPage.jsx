import { Navigate } from 'react-router-dom'
import { AuthShell } from '../components/login/AuthShell'
import { useAuthRedirect } from '../hooks/useAuthRedirect'

export function LoginPage() {
  const { selected, setSelected, finish, query, redirectTo } = useAuthRedirect()
  if (redirectTo) return <Navigate to={redirectTo} replace />

  return <AuthShell mode="login" role={selected} onRoleChange={setSelected} onSubmit={finish} alternateTo={`/register${query}`} />
}
