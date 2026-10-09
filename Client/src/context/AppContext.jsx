import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { ROLES } from '../constants/roles'
import { dashboardSites, dashboardTasks } from '../data/dashboard'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { AppContext } from './app-context'

const WORKSPACE_KEY = 'terralink.workspace.v1'
const initialWorkspace = {
  siteUpdates: {},
  decisions: {},
  tasks: dashboardTasks,
}

function readWorkspace() {
  try {
    const saved = window.localStorage.getItem(WORKSPACE_KEY)
    if (!saved) return initialWorkspace
    const parsed = JSON.parse(saved)
    return {
      siteUpdates: parsed.siteUpdates ?? {},
      decisions: parsed.decisions ?? {},
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : dashboardTasks,
    }
  } catch {
    return initialWorkspace
  }
}

function workspaceReducer(state, action) {
  switch (action.type) {
    case 'RECORD_DECISION':
      return {
        ...state,
        siteUpdates: {
          ...state.siteUpdates,
          [action.payload.siteId]: { status: action.payload.status },
        },
        decisions: {
          ...state.decisions,
          [action.payload.siteId]: action.payload,
        },
      }
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] }
    case 'RESET_DEMO':
      return { ...initialWorkspace, tasks: [...dashboardTasks] }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [roleId, setRoleId] = useLocalStorage('terralink.role', null)
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, readWorkspace)
  const role = roleId ? ROLES[roleId] : null
  const sites = useMemo(
    () => dashboardSites.map((site) => ({ ...site, ...workspace.siteUpdates[site.id] })),
    [workspace.siteUpdates],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
    } catch {
      // Persistence is optional when browser storage is unavailable.
    }
  }, [workspace])

  const recordDecision = useCallback((decision) => {
    dispatch({ type: 'RECORD_DECISION', payload: decision })
  }, [])

  const createTask = useCallback((task) => {
    dispatch({ type: 'ADD_TASK', payload: task })
  }, [])

  const resetDemo = useCallback(() => dispatch({ type: 'RESET_DEMO' }), [])
  const signOut = useCallback(() => setRoleId(null), [setRoleId])

  const value = useMemo(
    () => ({
      role,
      selectRole: setRoleId,
      signOut,
      sites,
      tasks: workspace.tasks,
      decisions: workspace.decisions,
      recordDecision,
      createTask,
      resetDemo,
    }),
    [createTask, recordDecision, resetDemo, role, setRoleId, signOut, sites, workspace.decisions, workspace.tasks],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
