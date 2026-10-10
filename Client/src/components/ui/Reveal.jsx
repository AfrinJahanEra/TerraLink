import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

/* Fades and lifts its children the first time they scroll into view. */
export function Reveal({ children, delay = 0, className }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || visible) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cn('reveal', visible && 'reveal-visible', className)}>
      {children}
    </div>
  )
}
