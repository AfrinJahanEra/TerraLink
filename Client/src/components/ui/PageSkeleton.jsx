export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8" role="status" aria-label="Loading workspace">
      <div className="mx-auto max-w-[1240px] animate-pulse">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-64 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-xl border border-slate-200 bg-white shadow-card" />)}
        </div>
        <div className="mt-6 h-80 rounded-xl border border-slate-200 bg-white shadow-card" />
      </div>
      <span className="sr-only">Loading workspace...</span>
    </div>
  )
}
