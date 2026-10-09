import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const styles = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

export const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', className, children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
})
