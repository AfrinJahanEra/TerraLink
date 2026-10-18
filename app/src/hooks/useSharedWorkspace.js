import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWorkspace, hasLocalServer, saveWorkspace } from '../services/localServer'

const POLL_MS = 3000
const MAX_CONFLICT_RETRIES = 5

/**
 * Reducer state shared by everyone using the workspace.
 * Each action is applied to the freshest saved copy rather than to this tab's snapshot, so one user's
 * change never overwrites another's. With the local data server running, actions are rebased onto the
 * server copy and other users' changes are pulled every few seconds; otherwise tabs of this browser
 * share localStorage and follow each other through storage events.
 */
export function useSharedWorkspace({ key, reducer, parse, initial }) {
  const readStored = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? parse(JSON.parse(raw)) : null
    } catch {
      return null
    }
  }, [key, parse])
  const [workspace, setWorkspace] = useState(() => readStored() ?? initial)
  const current = useRef(workspace)
  // mode is 'unknown' until the server check finishes, then 'remote' or 'local'.
  const sync = useRef({ mode: 'unknown', rev: 0, pending: [], flushing: false })

  const show = useCallback((next, persist = true) => {
    current.current = next
    setWorkspace(next)
    if (!persist) return
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Persistence is optional when browser storage is unavailable.
    }
  }, [key])

  const flush = useCallback(async () => {
    const state = sync.current
    if (state.mode !== 'remote' || state.flushing || !state.pending.length) return
    state.flushing = true
    try {
      while (state.pending.length) {
        const batch = state.pending.slice()
        let saved = await fetchWorkspace()
        let result = null
        for (let attempt = 0; attempt < MAX_CONFLICT_RETRIES && !result; attempt += 1) {
          const next = batch.reduce(reducer, saved.data ? parse(saved.data) : initial)
          const response = await saveWorkspace(saved.rev, next)
          if (response.conflict) saved = response.conflict
          else result = { rev: response.rev, next }
        }
        if (!result) return
        state.rev = result.rev
        state.pending.splice(0, batch.length)
        show(state.pending.reduce(reducer, result.next))
      }
    } catch {
      // The server is unreachable for now; the pending actions are retried on the next poll.
    } finally {
      state.flushing = false
    }
  }, [initial, parse, reducer, show])

  const pull = useCallback(async () => {
    const state = sync.current
    if (state.mode !== 'remote') return
    if (state.pending.length) {
      void flush()
      return
    }
    try {
      const saved = await fetchWorkspace()
      // A change made while the request was in flight wins; the next poll catches up.
      if (state.flushing || state.pending.length || !saved.data || saved.rev === state.rev) return
      state.rev = saved.rev
      show(parse(saved.data))
    } catch {
      // Keep showing the last known state while the server is unreachable.
    }
  }, [flush, parse, show])

  const dispatch = useCallback((action) => {
    const state = sync.current
    const next = reducer(state.mode === 'remote' ? current.current : readStored() ?? current.current, action)
    show(next)
    if (state.mode === 'local') return
    state.pending.push(action)
    void flush()
  }, [flush, readStored, reducer, show])

  useEffect(() => {
    let cancelled = false
    hasLocalServer().then(async (available) => {
      const state = sync.current
      if (cancelled) return
      if (!available) {
        state.mode = 'local'
        state.pending = []
        return
      }
      try {
        const saved = await fetchWorkspace()
        if (cancelled) return
        if (saved.data) {
          state.rev = saved.rev
          state.mode = 'remote'
          show(state.pending.reduce(reducer, parse(saved.data)))
          void flush()
        } else {
          // First run against an empty server: this browser's workspace becomes the shared one.
          const response = await saveWorkspace(0, current.current)
          state.rev = response.rev ?? response.conflict?.rev ?? 0
          state.pending = []
          state.mode = 'remote'
          if (response.conflict?.data) show(parse(response.conflict.data))
        }
      } catch {
        state.mode = 'local'
        state.pending = []
      }
    })
    return () => { cancelled = true }
  }, [flush, parse, reducer, show])

  useEffect(() => {
    const timer = window.setInterval(pull, POLL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') void pull() }
    const onStorage = (event) => {
      if (event.key !== key || !event.newValue || sync.current.pending.length) return
      try {
        show(parse(JSON.parse(event.newValue)), false)
      } catch {
        // Ignore a value another tab is still writing.
      }
    }
    window.addEventListener('focus', pull)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('storage', onStorage)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', pull)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('storage', onStorage)
    }
  }, [key, parse, pull, show])

  return [workspace, dispatch]
}
