import { BotMessageSquare, Database, RotateCcw, Send, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../hooks/useApp'
import {
  assistantQuestions,
  buildAssistantAnswer,
  getAssistantSiteSummary,
  matchAssistantQuestion,
} from '../utils/assistant'

const welcome = {
  id: 'welcome',
  role: 'assistant',
  text: 'একটি site বেছে নিয়ে সাজানো প্রশ্ন করুন। আমি বর্তমান task, সিদ্ধান্ত ও খরচের state থেকে উত্তর তৈরি করব।',
  sources: ['Live workspace state'],
}

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function AssistantPage() {
  const { can, scope, decisions, siteBudgets } = useApp()
  const { sites, tasks, expenses, communityReports } = scope
  const [siteId, setSiteId] = useState('gulshan-baridhara-lake')
  const [messages, setMessages] = useState([welcome])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const timerRef = useRef(null)
  const endRef = useRef(null)
  const site = sites.find((item) => item.id === siteId) ?? sites[0]

  useEffect(() => () => window.clearTimeout(timerRef.current), [])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, typing])

  function ask(questionId, questionText) {
    if (typing || !questionText.trim()) return
    const selectedSite = site
    const userMessage = { id: createMessageId('user'), role: 'user', text: questionText.trim(), site: selectedSite.name }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setTyping(true)
    timerRef.current = window.setTimeout(() => {
      const answer = buildAssistantAnswer({
        questionId,
        site: selectedSite,
        tasks,
        expenses,
        siteBudgets,
        decision: decisions[selectedSite.id],
        communityReports,
        showBudget: can('budget.view'),
      })
      setMessages((current) => [...current, { id: createMessageId('assistant'), role: 'assistant', ...answer }])
      setTyping(false)
    }, 720)
  }

  function submit(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text) return
    ask(matchAssistantQuestion(text), text)
  }

  function clearConversation() {
    window.clearTimeout(timerRef.current)
    setTyping(false)
    setMessages([welcome])
  }

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">বাংলা সহায়তা</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Simulated assistant</span></div><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Ask guided questions in Bangla and receive answers calculated from the current browser state.</p></div>
        <button type="button" onClick={clearConversation} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw size={15} />Clear chat</button>
      </header>

      <div className="grid min-h-[650px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/60 p-5 lg:border-b-0 lg:border-r">
          <label className="block"><span className="text-xs font-semibold text-slate-700">Site context</span><select value={siteId} onChange={(event) => setSiteId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-brand-400">{sites.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.location}</option>)}</select></label>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current context</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{getAssistantSiteSummary(site)}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">Answers update when tasks, decisions, or expenses change.</p></div>
          <div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggested questions</p><div className="mt-3 flex flex-wrap gap-2 lg:flex-col">{assistantQuestions.map((question) => <button key={question.id} type="button" disabled={typing} onClick={() => ask(question.id, question.label)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left font-bangla text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50">{question.label}</button>)}</div></div>
          <div className="mt-6 flex items-start gap-2 border-t border-slate-200 pt-4 text-[10px] leading-4 text-slate-500"><Database size={14} className="mt-0.5 shrink-0 text-slate-500" /><p>No external AI is called. Responses use deterministic templates and current workspace records.</p></div>
        </aside>

        <section className="flex min-h-[600px] flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><BotMessageSquare size={18} /></span><div><h2 className="text-sm font-semibold text-slate-900">Site guidance</h2><p className="text-[10px] text-slate-400">{site.name} · live local data</p></div></div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/30 p-4 sm:p-6" aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>{message.role === 'assistant' && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-800 text-white"><BotMessageSquare size={15} /></span>}<div className={`max-w-[85%] rounded-xl px-4 py-3 ${message.role === 'user' ? 'bg-brand-700 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-card'}`}>{message.site && <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-brand-100">{message.site}</p>}<p className="whitespace-pre-line font-bangla text-sm leading-7">{message.text}</p>{message.sources?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{message.sources.map((source) => <span key={source} className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">{source}</span>)}</div>}</div>{message.role === 'user' && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-200 text-slate-600"><UserRound size={15} /></span>}</div>)}
            {typing && <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-slate-800 text-white"><BotMessageSquare size={15} /></span><div className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 shadow-card" aria-label="Assistant is typing"><span className="assistant-dot size-1.5 rounded-full bg-slate-400" /><span className="assistant-dot size-1.5 rounded-full bg-slate-400" /><span className="assistant-dot size-1.5 rounded-full bg-slate-400" /></div></div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={submit} className="border-t border-slate-100 bg-white p-4"><div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} disabled={typing} placeholder="বাংলায় প্রশ্ন লিখুন" aria-label="Ask the simulated assistant" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 font-bangla text-sm text-slate-700 outline-none focus:border-brand-400 disabled:bg-slate-50" /><button type="submit" disabled={typing || !input.trim()} className="grid size-11 place-items-center rounded-lg bg-slate-800 text-white transition hover:bg-slate-900 disabled:opacity-40" aria-label="Send question"><Send size={16} /></button></div><p className="mt-2 text-[10px] text-slate-400">Questions outside the supported set return an insufficient-information response.</p></form>
        </section>
      </div>
    </div>
  )
}
