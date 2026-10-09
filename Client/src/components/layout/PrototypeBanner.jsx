import { FlaskConical, X } from 'lucide-react'
import { useState } from 'react'

export function PrototypeBanner() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="flex min-h-9 items-center justify-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-center text-xs font-medium text-slate-600">
      <FlaskConical size={14} aria-hidden="true" className="text-slate-500" />
      <span>Prototype workspace — operational records and measurements are illustrative sample data.</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss prototype notice"
        className="ml-1 rounded p-0.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
      >
        <X size={14} />
      </button>
    </div>
  )
}
