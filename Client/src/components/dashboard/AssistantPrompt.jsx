import { ArrowUp, Bot, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function AssistantPrompt() {
  const [question, setQuestion] = useState('')
  const navigate = useNavigate()

  function submit(event) {
    event.preventDefault()
    if (!question.trim()) return
    navigate('/assistant', { state: { question: question.trim() } })
  }

  return (
    <section className="overflow-hidden rounded-xl border border-brand-800 bg-brand-950 p-5 text-white shadow-card">
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white"><Bot size={18} /></span><div><div className="flex items-center gap-1.5"><h2 className="text-sm font-semibold">Bangla Assistant</h2><Sparkles size={12} className="text-white/70" /></div><p className="mt-1 text-xs leading-5 text-brand-100/65">Ask about pending work, costs, or review limitations.</p></div></div>
      <form onSubmit={submit} className="mt-4 flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-sm">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="বাংলায় প্রশ্ন করুন…" aria-label="Ask the Bangla assistant" className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
        <button type="submit" aria-label="Send question" disabled={!question.trim()} className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-700 text-white transition hover:bg-brand-800 disabled:bg-slate-200"><ArrowUp size={16} /></button>
      </form>
      <button type="button" onClick={() => setQuestion('কোন কাজগুলো এখনো বাকি?')} className="mt-3 text-left text-[11px] text-brand-100/70 hover:text-white">Try: “কোন কাজগুলো এখনো বাকি?”</button>
    </section>
  )
}
