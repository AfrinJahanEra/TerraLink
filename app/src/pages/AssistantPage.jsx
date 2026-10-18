import { ArrowUp, Globe, Lock, MessageSquarePlus, ShieldX, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Lightbox } from '../components/community/Lightbox'
import { PhotoImage } from '../components/community/PhotoImage'
import { useApp } from '../hooks/useApp'
import { ACCESS, answerQuestion } from '../utils/assistantEngine'
import { buildSiteBudgetRows } from '../utils/budget'
import { cn } from '../utils/cn'

const ACCESS_ICON = { confidential: Lock, personal: UserRound, public: Globe, denied: ShieldX }

let nextId = 0
const messageId = () => `m-${Date.now()}-${(nextId += 1)}`

function AnswerPhoto({ photo, onOpen }) {
  return (
    <figure className="min-w-0">
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {photo.url
          ? <button type="button" onClick={() => onOpen(photo.url)} className="block size-full" aria-label={`Open ${photo.caption}`}><img src={photo.url} alt={photo.caption} className="size-full object-cover" /></button>
          : <PhotoImage photoId={photo.photoId} alt={photo.caption} onClick={onOpen} />}
      </div>
      <figcaption className="mt-1 truncate text-[10.5px] text-slate-500">{photo.caption}</figcaption>
    </figure>
  )
}

function AssistantMessage({ answer, last, busy, onAsk, onOpenPhoto }) {
  const Icon = ACCESS_ICON[answer.access] ?? Globe
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-900"><Sparkles size={13} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-7 text-slate-900">{answer.title}</p>
        {answer.lines.map((line) => <p key={line} className="mt-1 text-[15px] leading-7 text-slate-700">{line}</p>)}
        {answer.bullets.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-slate-400">
            {answer.bullets.map((bullet) => <li key={bullet} className="pl-1 text-[15px] leading-7 text-slate-700">{bullet}</li>)}
          </ul>
        )}
        {answer.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {answer.photos.map((photo) => <AnswerPhoto key={photo.photoId ?? photo.url} photo={photo} onOpen={onOpenPhoto} />)}
          </div>
        )}
        <p className={cn('mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]', answer.access === 'denied' ? 'text-slate-700' : 'text-slate-400')}>
          <span className="inline-flex items-center gap-1 font-medium"><Icon size={12} />{ACCESS[answer.access]?.label}</span>
          {answer.sources.length > 0 && <><span aria-hidden="true">·</span><span>{answer.sources.join(', ')}</span></>}
        </p>
        {last && answer.followUps.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {answer.followUps.map((question) => <button key={question} type="button" disabled={busy} onClick={() => onAsk(question)} className="rounded-full border border-slate-200 px-3.5 py-1.5 text-[13px] text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{question}</button>)}
          </div>
        )}
      </div>
    </div>
  )
}

/** TerraLink Copilot: questions about lakes, tasks, reports and budgets, answered from live data within the role's access. */
export function AssistantPage() {
  const { role, can, scope, sites, decisions, siteBudgets, teamMembers, communityReports, expenses } = useApp()
  const isManager = can('budget.view')
  const [messages, setMessages] = useState([])
  const [memory, setMemory] = useState({})
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState('')
  const timer = useRef(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  // What the engine may read. A coordinator never receives budgets, team data or other people's tasks and expenses.
  const context = useMemo(() => ({
    isManager,
    sites,
    reports: communityReports,
    decisions,
    tasks: scope.tasks,
    expenses: isManager ? expenses : scope.expenses,
    meetings: scope.meetings,
    teamMembers: isManager ? teamMembers : [],
    budgetRows: isManager ? buildSiteBudgetRows(sites, scope.tasks, siteBudgets, expenses) : [],
  }), [communityReports, decisions, expenses, isManager, scope, siteBudgets, sites, teamMembers])

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])

  function ask(question) {
    const text = question.trim()
    if (!text || busy) return
    setMessages((current) => [...current, { id: messageId(), role: 'user', text }])
    setInput('')
    setBusy(true)
    timer.current = window.setTimeout(() => {
      const { answer, memory: next } = answerQuestion(text, context, memory)
      setMemory(next)
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', answer }])
      setBusy(false)
      inputRef.current?.focus()
    }, 550)
  }

  function reset() {
    window.clearTimeout(timer.current)
    setBusy(false)
    setMessages([])
    setMemory({})
  }

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')?.id

  const composer = (
    <form onSubmit={(event) => { event.preventDefault(); ask(input) }} className="w-full">
      <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-white p-2 pl-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] focus-within:border-slate-300">
        <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Message Copilot" aria-label="Message TerraLink Copilot" className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400" />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400"><ArrowUp size={18} /></button>
      </div>
    </form>
  )

  return (
    <div className="animate-fade-in flex h-[calc(100vh-6.5rem)] min-h-[520px] flex-col">
      <header className="flex items-center justify-between gap-3 pb-3">
        <h1 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Sparkles size={17} />TerraLink Copilot</h1>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex"><Lock size={12} />{isManager ? 'Full access' : 'Your work and lake information'}</span>
          <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"><MessageSquarePlus size={14} />New chat</button>
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">What can I help with, {role.user.name.split(' ')[0]}?</h2>
          <div className="mt-8 w-full max-w-3xl">{composer}</div>
          <p className="mt-3 text-center text-xs text-slate-400">Answers come from live TerraLink data{isManager ? '' : ', limited to your work and public lake information'}.</p>
        </div>
      ) : (
        <>
          <div className="thin-scroll -mx-4 flex-1 overflow-y-auto px-4" aria-live="polite">
            <div className="mx-auto max-w-3xl space-y-8 py-6">
              {messages.map((message) => (message.role === 'user' ? (
                <div key={message.id} className="flex justify-end"><p className="max-w-[75%] rounded-3xl bg-slate-100 px-5 py-2.5 text-[15px] leading-7 text-slate-900">{message.text}</p></div>
              ) : (
                <AssistantMessage key={message.id} answer={message.answer} last={message.id === lastAssistant} busy={busy} onAsk={ask} onOpenPhoto={setLightbox} />
              )))}
              {busy && (
                <div className="flex gap-4">
                  <span className="grid size-7 place-items-center rounded-full border border-slate-200 text-slate-900"><Sparkles size={13} /></span>
                  <div className="flex h-7 items-center gap-1" aria-label="Copilot is answering"><span className="assistant-dot size-2 rounded-full bg-slate-400" /><span className="assistant-dot size-2 rounded-full bg-slate-400" /><span className="assistant-dot size-2 rounded-full bg-slate-400" /></div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>
          <div className="mx-auto w-full max-w-3xl pt-3">
            {composer}
            <p className="mt-2 text-center text-[11px] text-slate-400">Copilot answers from live workspace data. Check important figures before acting on them.</p>
          </div>
        </>
      )}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox('')} />}
    </div>
  )
}
