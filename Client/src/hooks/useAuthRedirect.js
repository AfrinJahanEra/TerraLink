import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { homePathFor, ROLES, safeNextPath } from '../constants/roles'
import { useApp } from './useApp'

/** Shared by the log in and register pages: role preselection and where to go afterwards. */
export function useAuthRedirect() {
  const { role, selectRole } = useApp()
  const [searchParams] = useSearchParams()
  const next = safeNextPath(searchParams.get('next'))
  const requestedRole = ROLES[searchParams.get('role')] ? searchParams.get('role') : null
  const [selected, setSelected] = useState(requestedRole ?? 'manager')
  const navigate = useNavigate()
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

  function finish(event) {
    event.preventDefault()
    selectRole(selected)
    navigate(next ?? homePathFor(selected))
  }

  return { selected, setSelected, finish, query, redirectTo: role ? (next ?? homePathFor(role.id)) : null }
}
