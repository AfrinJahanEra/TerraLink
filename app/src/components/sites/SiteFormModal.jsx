import { Camera, Eraser, ImagePlus, LoaderCircle, LocateFixed, MapPinned, MousePointerClick, Plus, Search, TriangleAlert, Undo2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AUTHORITIES, SATELLITE_MIN_HA, SITE_TYPES, STARTING_STATUSES } from '../../constants/sites'
import { PHOTO_RULES } from '../../constants/reports'
import { SITE_STATUS } from '../../constants/status'
import { useApp } from '../../hooks/useApp'
import { compressImage, putPhoto } from '../../services/photoStore'
import { cn } from '../../utils/cn'
import { outlineGeometry } from '../../utils/geo'
import { Button } from '../ui/Button'
import { OutlineDrawer } from './OutlineDrawer'

const inputClass = 'mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

function Field({ label, hint, error, className, children }) {
  return (
    <label className={cn('block', className)}>
      <span className="text-[11px] font-semibold text-slate-700">{label}{hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-[10.5px] font-medium text-rose-600">{error}</span>}
    </label>
  )
}

function Group({ step, title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <span className="grid size-4 place-items-center rounded-full bg-brand-100 text-[9px] text-brand-800">{step}</span>{title}
      </h3>
      {children}
    </section>
  )
}

/** One optional photo: a compact drop area that turns into a preview. */
function BaselinePhoto({ photo, onChange }) {
  const input = useRef(null)
  const [problem, setProblem] = useState('')
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])

  function choose(file) {
    if (!file) return
    if (!PHOTO_RULES.types.includes(file.type)) return setProblem('Use a JPG, PNG or WebP image.')
    if (file.size > PHOTO_RULES.maxBytes) return setProblem('The photo is larger than 10 MB.')
    setProblem('')
    onChange({ file, url: URL.createObjectURL(file) })
  }

  return (
    <div>
      {photo ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
          <img src={photo.url} alt="Baseline" className="h-14 w-20 rounded-md object-cover" />
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{photo.file.name}</p><p className="text-[10.5px] text-slate-400">Shown as the “before” photo</p></div>
          <button type="button" onClick={() => onChange(null)} aria-label="Remove photo" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600"><X size={15} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-left transition hover:border-brand-400 hover:bg-white">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-card"><ImagePlus size={16} /></span>
          <span><span className="block text-xs font-semibold text-slate-700">Add a baseline photo</span><span className="block text-[10.5px] text-slate-400">The lake in a clean state · JPG, PNG or WebP</span></span>
        </button>
      )}
      <input ref={input} type="file" accept={PHOTO_RULES.types.join(',')} className="sr-only" onChange={(event) => { choose(event.target.files?.[0]); event.target.value = '' }} />
      {problem && <p role="alert" className="mt-1 text-[10.5px] font-medium text-rose-600">{problem}</p>}
    </div>
  )
}

/** Searches OpenStreetMap place names inside Bangladesh; one request per search. */
async function findPlace(query) {
  const params = new URLSearchParams({ q: query, format: 'json', limit: '1', countrycodes: 'bd' })
  const results = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: 'application/json' } }).then((response) => (response.ok ? response.json() : []))
  return results[0] ? [Number(results[0].lat), Number(results[0].lon)] : null
}

/** Adds a water body to the register: the outline drawn on the aerial map on the left, details on the right. */
export function SiteFormModal({ onClose, onCreated }) {
  const { sites, addSite, can } = useApp()
  const [form, setForm] = useState({ name: '', nameBn: '', location: '', type: 'lake', authority: AUTHORITIES[0], status: '', reviewNote: '', plannedBudget: '' })
  const [points, setPoints] = useState([])
  const [photo, setPhoto] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState({ query: '', busy: false, message: '' })
  const [target, setTarget] = useState(null)
  const geometry = useMemo(() => (points.length >= 3 ? outlineGeometry(points) : null), [points])
  const small = geometry && geometry.areaHa < SATELLITE_MIN_HA
  const status = form.status || (small ? 'insufficient_data' : 'needs_review')
  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  // The dialog fills the screen, so the page behind it must not scroll as well.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function goToPlace(event) {
    event.preventDefault()
    const query = search.query.trim()
    if (!query) return
    const coordinates = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
    if (coordinates) {
      setTarget([Number(coordinates[1]), Number(coordinates[2])])
      return
    }
    setSearch((current) => ({ ...current, busy: true, message: '' }))
    const found = await findPlace(query).catch(() => null)
    if (found) setTarget(found)
    setSearch((current) => ({ ...current, busy: false, message: found ? '' : 'Place not found. Try another name or paste coordinates.' }))
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((position) => setTarget([position.coords.latitude, position.coords.longitude]), () => setSearch((current) => ({ ...current, message: 'Your location could not be read.' })))
  }

  function changePoints(next) {
    setPoints(next)
    setErrors((current) => ({ ...current, outline: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    const found = {}
    if (form.name.trim().length < 2) found.name = 'Enter the name of the water body.'
    else if (sites.some((site) => site.name.toLowerCase() === form.name.trim().toLowerCase())) found.name = 'A site with this name is already in the register.'
    if (form.location.trim().length < 2) found.location = 'For example Mirpur, Dhaka.'
    if (!geometry) found.outline = 'Click at least three points on the map around the water.'
    else if (geometry.areaHa < 0.01) found.outline = 'The outline is too small. Zoom in and trace the water edge.'
    if (form.plannedBudget && Number(form.plannedBudget) < 0) found.plannedBudget = 'The budget cannot be negative.'
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    try {
      let baselinePhotoId = null
      if (photo) {
        baselinePhotoId = `baseline-${Date.now()}`
        await putPhoto(baselinePhotoId, await compressImage(photo.file))
      }
      const id = addSite({
        body: {
          name: form.name.trim(),
          location: form.location.trim(),
          areaHa: Number(geometry.areaHa.toFixed(2)),
          center: geometry.center,
          bbox: geometry.bbox,
          ring: points,
          holes: [],
        },
        nameBn: form.nameBn.trim(),
        type: form.type,
        authority: form.authority,
        status,
        reviewNote: form.reviewNote.trim() || (status === 'insufficient_data'
          ? 'Added to the register. Under one hectare, so field evidence is needed instead of a satellite comparison.'
          : 'Added to the register. Waiting for its first satellite comparison.'),
        plannedBudget: can('budget.edit') ? Number(form.plannedBudget) || 0 : 0,
        baselinePhotoId,
      })
      onCreated(id)
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'The site could not be added.' })
      setSaving(false)
    }
  }

  const hint = points.length === 0 ? 'Zoom in, then click along the water edge' : points.length < 3 ? `Add ${3 - points.length} more ${3 - points.length === 1 ? 'point' : 'points'}` : 'Outline closed · keep clicking to refine'

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-center overflow-hidden bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="site-form-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <form onSubmit={submit} noValidate className="animate-fade-in relative z-10 flex h-full max-h-[820px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-pop">
        <header className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-700 px-5 py-3.5 text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-cyan-200"><MapPinned size={18} /></span>
          <div className="min-w-0 flex-1">
            <h2 id="site-form-title" className="text-[15px] font-semibold">Add a water body</h2>
            <p className="truncate text-[11px] text-brand-100">Trace the outline on the aerial map, then fill in the details.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"><X size={17} /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(280px,48%)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)] lg:grid-rows-1">
          {/* Map */}
          <section aria-label="Outline" className="flex min-h-0 flex-col gap-2.5 bg-slate-50 p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search.query} onChange={(event) => setSearch({ query: event.target.value, busy: false, message: '' })} onKeyDown={(event) => { if (event.key === 'Enter') goToPlace(event) }} placeholder="Find a place or paste lat, lon" aria-label="Find a place" className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-brand-400" />
              </div>
              <Button type="button" variant="secondary" onClick={goToPlace} disabled={search.busy} className="h-9 min-h-9 px-3 text-xs">{search.busy ? <LoaderCircle size={14} className="animate-spin" /> : 'Go'}</Button>
              <Button type="button" variant="secondary" onClick={useMyLocation} className="h-9 min-h-9 px-2.5" title="Go to my location" aria-label="Go to my location"><LocateFixed size={15} /></Button>
            </div>
            {search.message && <p className="text-[11px] text-amber-700">{search.message}</p>}

            <div className={cn('relative min-h-0 flex-1 overflow-hidden rounded-xl ring-1', errors.outline ? 'ring-2 ring-rose-300' : 'ring-slate-200')}>
              <OutlineDrawer points={points} onChange={changePoints} sites={sites} target={target} className="absolute inset-0" />

              <span className="pointer-events-none absolute left-1/2 top-3 z-[1000] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-950/80 px-3 py-1.5 text-[10.5px] font-semibold text-white shadow-lg backdrop-blur-sm">
                <MousePointerClick size={13} className="text-green-300" />{hint}
              </span>
              <div className="absolute right-3 top-3 z-[1000] flex gap-1.5">
                <button type="button" onClick={() => changePoints(points.slice(0, -1))} disabled={!points.length} title="Undo last point" className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-card transition hover:bg-slate-50 disabled:opacity-40"><Undo2 size={13} />Undo</button>
                <button type="button" onClick={() => changePoints([])} disabled={!points.length} title="Clear outline" className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-card transition hover:bg-slate-50 disabled:opacity-40"><Eraser size={13} />Clear</button>
              </div>
              <div className="pointer-events-none absolute bottom-6 left-3 z-[1000] flex flex-wrap gap-1.5">
                {[
                  ['Area', geometry ? `${geometry.areaHa.toFixed(2)} ha` : '—'],
                  ['Points', points.length],
                  ['Satellite', geometry ? (small ? 'Too small' : 'Measurable') : '—'],
                ].map(([label, value]) => (
                  <span key={label} className="rounded-lg bg-slate-950/75 px-2.5 py-1.5 text-white backdrop-blur-sm">
                    <span className="block text-[8.5px] font-bold uppercase tracking-[0.12em] text-slate-300">{label}</span>
                    <span className={cn('block text-xs font-semibold', label === 'Satellite' && small ? 'text-amber-300' : label === 'Satellite' && geometry ? 'text-green-300' : '')}>{value}</span>
                  </span>
                ))}
              </div>
            </div>
            {errors.outline && <p role="alert" className="text-[11px] font-medium text-rose-600">{errors.outline}</p>}
            {small && <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10.5px] leading-4 text-amber-900"><TriangleAlert size={13} className="mt-px shrink-0" />Under {SATELLITE_MIN_HA} ha the water is only a few 10 m satellite pixels wide, so it starts as “Insufficient data” and relies on field and community photos.</p>}
          </section>

          {/* Details: the only scrolling area */}
          <section aria-label="Details" className="thin-scroll min-h-0 space-y-5 overflow-y-auto border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
            <Group step="1" title="Identity">
              <Field label="Name" error={errors.name}><input value={form.name} onChange={set('name')} placeholder="Uttara Lake" className={inputClass} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bangla name" hint="optional"><input value={form.nameBn} onChange={set('nameBn')} placeholder="উত্তরা লেক" className={cn(inputClass, 'font-bangla')} /></Field>
                <Field label="Area and city" error={errors.location}><input value={form.location} onChange={set('location')} placeholder="Uttara, Dhaka" className={inputClass} /></Field>
              </div>
            </Group>

            <Group step="2" title="Classification">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type"><select value={form.type} onChange={set('type')} className={inputClass}>{Object.entries(SITE_TYPES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></Field>
                <Field label="Starting status" hint={form.status ? '' : '(auto)'}><select value={status} onChange={set('status')} className={inputClass}>{STARTING_STATUSES.map((id) => <option key={id} value={id}>{SITE_STATUS[id].label}</option>)}</select></Field>
              </div>
              <Field label="Responsible authority"><select value={form.authority} onChange={set('authority')} className={inputClass}>{AUTHORITIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
            </Group>

            <Group step="3" title="Monitoring">
              <Field label="Why monitor this site" hint="optional">
                <textarea value={form.reviewNote} onChange={set('reviewNote')} rows={2} maxLength={400} placeholder="Residents report fresh earth filling on the east bank since August." className={cn(inputClass, 'h-auto resize-none py-2 leading-5')} />
              </Field>
              {can('budget.edit') && (
                <Field label="Planned budget" hint="BDT, optional" error={errors.plannedBudget}>
                  <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-xs text-slate-400">৳</span><input type="number" min="0" step="500" value={form.plannedBudget} onChange={set('plannedBudget')} placeholder="25,000" className={cn(inputClass, 'pl-7')} /></div>
                </Field>
              )}
            </Group>

            <Group step="4" title="Baseline photo">
              <BaselinePhoto photo={photo} onChange={setPhoto} />
            </Group>

            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[10.5px] leading-4 text-slate-500"><Camera size={13} className="mt-px shrink-0" />The outline is recorded as drawn by you and unverified until checked in the field. Run the first satellite comparison from the site page after saving.</p>
          </section>
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white px-5 py-3">
          {errors.form
            ? <p role="alert" className="mr-auto text-[11px] font-medium text-rose-600">{errors.form}</p>
            : <p className="mr-auto hidden text-[11px] text-slate-400 sm:block">{geometry ? `${form.name.trim() || 'New site'} · ${geometry.areaHa.toFixed(2)} ha · ${SITE_TYPES[form.type].label}` : 'Draw the outline to continue'}</p>}
          <Button type="button" variant="secondary" onClick={onClose} className="h-9 min-h-9">Cancel</Button>
          <Button type="submit" disabled={saving} className="h-9 min-h-9">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{saving ? 'Adding' : 'Add to register'}</Button>
        </footer>
      </form>
    </div>
  )
}
