import { AuthShell } from '../components/login/AuthShell'
import { useAuthRedirect } from '../hooks/useAuthRedirect'

/** Always shows the form, even when someone is already signed in; submitting replaces the current session. */
export function RegisterPage() {
  const { selected, setSelected, finish, query } = useAuthRedirect()
  return <AuthShell mode="register" role={selected} onRoleChange={setSelected} onSubmit={finish} alternateTo={`/login${query}`} />
}
