import { useEffect, useState } from 'react'

function readValue(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** useState that persists to localStorage. `null`/`undefined` removes the key. */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readValue(key, initialValue))

  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch {
      // Storage may be unavailable (private mode / quota); state still works in memory.
    }
  }, [key, value])

  return [value, setValue]
}
