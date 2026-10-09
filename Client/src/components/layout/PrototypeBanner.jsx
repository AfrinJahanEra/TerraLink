import { FlaskConical, X } from 'lucide-react'
import { useState } from 'react'

export function PrototypeBanner() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="flex min-h-9 items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
      <FlaskConical size={14} aria-hidden="true" />
      <span>Prototype workspace — operational records and measurements are illustrative sample data.</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss prototype notice"
        className="ml-1 rounded p-0.5 text-amber-700 transition hover:bg-amber-100"
      >
        <X size={14} />
      </button>
    </div>
  )
}
