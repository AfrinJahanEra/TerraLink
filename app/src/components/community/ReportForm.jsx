import { Camera, CircleCheck, LoaderCircle, LocateFixed, LockKeyhole, ScanSearch, Send, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PHOTO_RULES, REPORT_CATEGORIES } from '../../constants/reports'
import { useApp } from '../../hooks/useApp'
import { compressImage, putPhoto } from '../../services/photoStore'
import { summarizeAnalyses } from '../../services/wasteDetection'
import { attachWastePdf } from '../../services/wastePdf'
import { cn } from '../../utils/cn'
import { findSiteForPoint } from '../../utils/geo'
import { todayInDhaka } from '../../utils/reports'
import { Button } from '../ui/Button'
import { LocationPicker } from './LocationPicker'
import { WasteScanModal } from './WasteScanModal'

const inputClass = 'mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

const PROBLEM_TARGETS = { photos: 'evidence-heading', category: 'details-heading', observedAt: 'details-heading', description: 'details-heading', location: 'location-heading' }

function Card({ number, id, title, hint, className, children }) {
  return (
    <section aria-labelledby={id} className={cn('flex flex-col rounded-xl border border-slate-200 bg-white shadow-card', className)}>
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
        <span className="grid size-5 place-items-center rounded-full bg-brand-700 text-[10px] font-bold text-white">{number}</span>
        <h2 id={id} className="text-[13px] font-semibold text-slate-900">{title}</h2>
        {hint && <span className="ml-auto hidden text-[11px] text-slate-400 sm:block">{hint}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </section>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      {hint && <span className="ml-2 text-[11px] font-normal text-slate-400">{hint}</span>}
      {children}
      {error && <span role="alert" className="mt-1.5 block text-[11px] font-medium text-rose-600">{error}</span>}
    </label>
  )
}

/** Public report form. Calls `onSubmitted(report)` once the photos and the record are saved. */
export function ReportForm({ initialSiteId = '', onSubmitted }) {
  const { sites, submitReport, role } = useApp()
  const initialSite = sites.find((site) => site.id === initialSiteId) ?? null
  const [photos, setPhotos] = useState([])
  const [category, setCategory] = useState('')
  const [siteId, setSiteId] = useState(initialSite?.id ?? '')
  const [location, setLocation] = useState(initialSite ? initialSite.coordinates : null)
  const [observedAt, setObservedAt] = useState(todayInDhaka())
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const previews = useRef(new Set())
  const fileInput = useRef(null)
  const summaryRef = useRef(null)
  const [attempt, setAttempt] = useState(0)
  // Photos waiting in, or reopened in, the AI waste detection window.
  const [scanUrls, setScanUrls] = useState([])

  useEffect(() => {
    const urls = previews.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const focusSite = sites.find((site) => site.id === siteId) ?? null
  const problems = Object.entries(errors).filter(([, message]) => message)
  const scanItems = photos.filter((photo) => scanUrls.includes(photo.url))
  const allScanned = photos.every((photo) => photo.analysis)
  const wasteFound = photos.some((photo) => photo.analysis?.hasWaste)

  // After a failed submit, bring the list of problems into view so the click never looks like it did nothing.
  useEffect(() => {
    if (attempt) summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [attempt])

  function addFiles(fileList) {
    const next = []
    let problem = ''
    Array.from(fileList).forEach((file) => {
      if (!PHOTO_RULES.types.includes(file.type)) problem = `${file.name} is not a JPG, PNG or WebP image.`
      else if (file.size > PHOTO_RULES.maxBytes) problem = `${file.name} is larger than 10 MB.`
      else next.push(file)
    })
    const room = PHOTO_RULES.maxFiles - photos.length
    if (next.length > room) problem = `You can attach up to ${PHOTO_RULES.maxFiles} photos.`
    const accepted = next.slice(0, Math.max(room, 0)).map((file) => {
      const url = URL.createObjectURL(file)
      previews.current.add(url)
      return { file, url, analysis: null, annotatedBlob: null, annotatedUrl: '' }
    })
    setPhotos((current) => [...current, ...accepted])
    if (accepted.length) setScanUrls(accepted.map((photo) => photo.url))
    setErrors((current) => ({ ...current, photos: problem }))
    if (fileInput.current) fileInput.current.value = ''
  }

  function removePhoto(url) {
    const removed = photos.find((photo) => photo.url === url)
    ;[url, removed?.annotatedUrl].filter(Boolean).forEach((item) => {
      URL.revokeObjectURL(item)
      previews.current.delete(item)
    })
    setPhotos((current) => current.filter((photo) => photo.url !== url))
    setScanUrls((current) => current.filter((item) => item !== url))
  }

  const handleScanResult = useCallback((url, { analysis, annotatedBlob }) => {
    const annotatedUrl = annotatedBlob ? URL.createObjectURL(annotatedBlob) : ''
    if (annotatedUrl) previews.current.add(annotatedUrl)
    setPhotos((current) => current.map((photo) => (photo.url === url ? { ...photo, analysis, annotatedBlob, annotatedUrl } : photo)))
    if (analysis.hasWaste) {
      setCategory((current) => current || 'waste_dumping')
      setErrors((current) => ({ ...current, photos: '', category: '' }))
    }
  }, [])

  function chooseSite(id) {
    setSiteId(id)
    setErrors((current) => ({ ...current, location: '' }))
    const site = sites.find((item) => item.id === id)
    if (site) setLocation(site.coordinates)
  }

  function pickLocation(point) {
    setLocation(point)
    setSiteId(findSiteForPoint(point, sites)?.id ?? 'other')
    setErrors((current) => ({ ...current, location: '' }))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErrors((current) => ({ ...current, location: 'This browser cannot share your location. Tap the map instead.' }))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => { setLocating(false); pickLocation([position.coords.latitude, position.coords.longitude]) },
      () => { setLocating(false); setErrors((current) => ({ ...current, location: 'Your location could not be read. Tap the map instead.' })) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function validate() {
    const next = {}
    if (!photos.length) next.photos = 'Add at least one photo of the problem.'
    else if (!wasteFound) next.photos = 'No waste was detected in the photos. Add a closer photo of the waste.'
    if (!category) next.category = 'Choose the type of problem.'
    if (!location) next.location = 'Mark the location on the map.'
    if (!observedAt) next.observedAt = 'Enter the date you saw the problem.'
    else if (observedAt > todayInDhaka()) next.observedAt = 'The date cannot be in the future.'
    if (description.trim().length < 10) next.description = 'Describe what you saw in at least a few words.'
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    setSubmitError('')
    if (Object.keys(found).length) {
      setAttempt((count) => count + 1)
      return
    }

    setSubmitting(true)
    try {
      const stamp = Date.now()
      const stored = []
      const analyses = []
      for (const [index, photo] of photos.entries()) {
        const id = `photo-${stamp}-${index}`
        await putPhoto(id, await compressImage(photo.file))
        stored.push({ id, name: photo.file.name })
        const annotatedPhotoId = photo.annotatedBlob ? `ai-photo-${stamp}-${index}` : null
        if (annotatedPhotoId) await putPhoto(annotatedPhotoId, photo.annotatedBlob)
        analyses.push({ ...photo.analysis, photoId: id, annotatedPhotoId, name: photo.file.name })
      }
      const report = submitReport({
        siteId: siteId && siteId !== 'other' ? siteId : null,
        category,
        description: description.trim(),
        latitude: location[0],
        longitude: location[1],
        observedAt,
        photos: stored,
        aiAnalysis: { ...summarizeAnalyses(analyses), pdfId: `ai-report-${stamp}` },
        reporter: { name: role.user.name, email: role.user.email, contact: contact.trim() },
      })
      // The PDF is rebuilt from the saved analysis when it is opened, so a failure here does not block the report.
      await attachWastePdf(report, sites.find((site) => site.id === report.siteId)?.name).catch(() => undefined)
      onSubmitted(report)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The report could not be saved. Please try again.')
      setSubmitting(false)
    }
  }

  const siteName = sites.find((site) => site.id === siteId)?.name
  const fieldHeight = 'h-10'

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card number="1" id="evidence-heading" title="Photo evidence" hint={`Up to ${PHOTO_RULES.maxFiles} photos`}>
        <div className={cn('grid flex-1 grid-cols-3 gap-2.5', photos.length ? 'content-start' : 'content-stretch')}>
          {photos.map((photo, index) => (
            <div key={photo.url} className={cn('relative aspect-[4/3] overflow-hidden rounded-lg border bg-slate-100', photo.analysis?.hasWaste ? 'border-green-500 ring-2 ring-green-500/30' : 'border-slate-200')}>
              <button type="button" onClick={() => setScanUrls([photo.url])} aria-label={`Open AI result for photo ${index + 1}`} className="block size-full">
                <img src={photo.annotatedUrl || photo.url} alt={`Selected photo ${index + 1}`} className="size-full object-cover" />
              </button>
              <span className={cn('pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-card', photo.analysis?.hasWaste ? 'bg-green-500 text-white' : 'bg-white/95 text-slate-600')}>
                {photo.analysis?.hasWaste ? <><CircleCheck size={11} />Waste {Math.round(photo.analysis.confidence * 100)}%</> : photo.analysis ? 'No waste' : <><ScanSearch size={11} />Scanning</>}
              </span>
              <button type="button" onClick={() => removePhoto(photo.url)} aria-label={`Remove photo ${index + 1}`} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-white/95 text-slate-700 shadow-card hover:text-rose-600"><X size={14} /></button>
            </div>
          ))}
          {photos.length < PHOTO_RULES.maxFiles && (
            <label className={cn('flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-slate-50 text-center text-slate-500 transition hover:border-brand-400 hover:bg-white', errors.photos ? 'border-rose-300' : 'border-slate-300', photos.length === 0 ? 'col-span-3 min-h-40' : 'aspect-[4/3]')}>
              <Camera size={20} />
              <span className="px-2 text-xs font-semibold text-slate-700">{photos.length === 0 ? 'Take or choose a photo of the problem' : 'Add another'}</span>
              {photos.length === 0 && <span className="px-2 text-[11px] text-slate-400">JPG, PNG or WebP, up to 10 MB. Include a wide shot if you can.</span>}
              <input ref={fileInput} type="file" accept={PHOTO_RULES.types.join(',')} multiple className="sr-only" onChange={(event) => addFiles(event.target.files)} />
            </label>
          )}
        </div>
        {errors.photos && <p role="alert" className="mt-2 text-[11px] font-medium text-rose-600">{errors.photos}</p>}
      </Card>

      <Card number="2" id="details-heading" title="What happened" hint="Facts only: what, where, how large">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Problem type" error={errors.category}>
            <select value={category} onChange={(event) => { setCategory(event.target.value); setErrors((current) => ({ ...current, category: '' })) }} className={cn(inputClass, fieldHeight)}>
              <option value="">Choose a type</option>
              {Object.entries(REPORT_CATEGORIES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="Date you saw it" error={errors.observedAt}>
            <input type="date" value={observedAt} max={todayInDhaka()} onChange={(event) => { setObservedAt(event.target.value); setErrors((current) => ({ ...current, observedAt: '' })) }} className={cn(inputClass, fieldHeight)} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Description" error={errors.description}>
            <textarea value={description} onChange={(event) => { setDescription(event.target.value); setErrors((current) => ({ ...current, description: '' })) }} rows={3} maxLength={600} placeholder="Plastic bags and household waste piled along the north bank, about 10 metres long." className={cn(inputClass, 'py-2 text-[13px] leading-5')} />
          </Field>
          <p className="mt-1 text-right text-[10px] text-slate-400">{description.length}/600</p>
        </div>
      </Card>

      <Card number="3" id="location-heading" title="Location" hint="Tap the map to place the pin" className="lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          <LocationPicker sites={sites} value={location} focusSite={focusSite} onChange={pickLocation} className="h-72 lg:h-[330px]" />
          <div className="flex flex-col gap-3">
            <Field label="Water body">
              <select value={siteId} onChange={(event) => chooseSite(event.target.value)} className={cn(inputClass, fieldHeight)}>
                <option value="">Choose a water body</option>
                {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                <option value="other">Different location</option>
              </select>
            </Field>
            <Button type="button" variant="secondary" onClick={useMyLocation} disabled={locating} className="h-10">
              {locating ? <LoaderCircle size={15} className="animate-spin" /> : <LocateFixed size={15} className="text-slate-600" />}Use my location
            </Button>
            <div className={cn('rounded-lg border px-3 py-2.5 text-xs leading-5', location ? 'border-brand-200 bg-brand-50 text-brand-900' : 'border-slate-200 bg-slate-50 text-slate-500')}>
              {location ? (
                <>
                  <p className="font-semibold">Pin placed</p>
                  <p className="font-mono text-[11px]">{location[0].toFixed(5)}, {location[1].toFixed(5)}</p>
                  <p className="mt-1">{siteId === 'other' ? 'Outside the five monitored water bodies, so it is saved as a location report.' : `Linked to ${siteName ?? 'the selected water body'}.`}</p>
                </>
              ) : 'No pin yet. Choose a water body, tap the map, or use your location.'}
            </div>
            {errors.location && <p role="alert" className="text-[11px] font-medium text-rose-600">{errors.location}</p>}
            <ul className="mt-auto space-y-1.5 border-t border-slate-100 pt-3 text-[11px] leading-4 text-slate-500">
              <li>Zoom in and tap the exact spot, such as the stretch of bank with the waste.</li>
              <li>A pin on or within about 60 m of an outline is linked to that water body automatically.</li>
              <li>Outlines are community-mapped and may be a few metres off.</li>
            </ul>
          </div>
        </div>
      </Card>

      {(submitError || (attempt > 0 && problems.length > 0)) && (
        <div className="space-y-2 lg:col-span-2">
          {submitError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">{submitError}</p>}
          {attempt > 0 && problems.length > 0 && (
            <div ref={summaryRef} role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs font-semibold text-rose-800">The report was not sent. {problems.length === 1 ? 'One thing needs fixing:' : `${problems.length} things need fixing:`}</p>
              <ul className="mt-2 space-y-1">
                {problems.map(([key, message]) => (
                  <li key={key}><button type="button" onClick={() => document.getElementById(PROBLEM_TARGETS[key])?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-left text-xs font-medium text-rose-700 underline underline-offset-2 hover:text-rose-900">{message}</button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <section aria-label="Reporter and submit" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card lg:col-span-2 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{role.user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{role.user.name}</p><p className="truncate text-[11px] text-slate-500">{role.user.email} · visible to reviewers only</p></div>
        </div>
        <label className="flex items-center gap-2 lg:ml-4">
          <span className="shrink-0 text-xs font-semibold text-slate-700">Phone <span className="font-normal text-slate-400">(optional)</span></span>
          <input value={contact} onChange={(event) => setContact(event.target.value)} maxLength={40} autoComplete="tel" className={cn(inputClass, 'mt-0 h-9 w-40')} />
        </label>
        <div className="flex flex-col gap-1.5 lg:ml-auto lg:flex-row lg:items-center lg:gap-3">
          {!wasteFound && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <LockKeyhole size={13} className="shrink-0" />{photos.length && !allScanned ? 'Waiting for the AI scan to finish' : 'Submit unlocks when AI detects waste in a photo'}
            </p>
          )}
          <Button type="submit" disabled={submitting || !wasteFound || !allScanned} className="h-10 px-6">
            {submitting ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}{submitting ? 'Saving report' : 'Submit report'}
          </Button>
        </div>
      </section>
      {scanItems.length > 0 && <WasteScanModal items={scanItems} onResult={handleScanResult} onRemove={removePhoto} onClose={() => setScanUrls([])} />}
    </form>
  )
}
