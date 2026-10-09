import { useCallback, useEffect, useRef, useState } from 'react'

export function useNotice(duration = 3000) {
  const [notice, setNotice] = useState('')
  const timer = useRef(null)

  const showNotice = useCallback((message) => {
    window.clearTimeout(timer.current)
    setNotice(message)
    timer.current = window.setTimeout(() => setNotice(''), duration)
  }, [duration])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return [notice, showNotice]
}
