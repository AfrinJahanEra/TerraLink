import { useMemo } from 'react'
import { ROLES } from '../constants/roles'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { AppContext } from './app-context'

export function AppProvider({ children }) {
  const [roleId, setRoleId] = useLocalStorage('terralink.role', null)
  const role = roleId ? ROLES[roleId] : null

  const value = useMemo(
    () => ({
      role,
      selectRole: setRoleId,
      signOut: () => setRoleId(null),
    }),
    [role, setRoleId],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
