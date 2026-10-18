import { useEffect } from 'react'

/** Calls `handler` on outside pointer-down or Escape while `active` is true. */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined

    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) handler()
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') handler()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, handler, active])
}
