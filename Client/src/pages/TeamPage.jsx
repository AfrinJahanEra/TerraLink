import { Check, Search, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MemberCard } from '../components/team/MemberCard'
import { MemberModal } from '../components/team/MemberModal'
import { Button } from '../components/ui/Button'
import { useApp } from '../hooks/useApp'

export function TeamPage() {
  const { role, tasks, teamMembers, addTeamMember, updateTeamMember } = useApp()
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('all')
  const [editingMember, setEditingMember] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalVersion, setModalVersion] = useState(0)
  const [notice, setNotice] = useState('')
  const canManage = role.id === 'manager' || role.id === 'operator'

  const openTaskCounts = useMemo(() => tasks
    .filter((task) => task.status !== 'reported_complete')
    .reduce((counts, task) => ({ ...counts, [task.assignee]: (counts[task.assignee] ?? 0) + 1 }), {}), [tasks])

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return teamMembers.filter((member) => {
      const matchesSearch = !query || `${member.name} ${member.role} ${member.email}`.toLowerCase().includes(query)
      return matchesSearch && (availability === 'all' || member.availability === availability)
    })
  }, [availability, search, teamMembers])

  const availableCount = teamMembers.filter((member) => member.availability === 'available').length
  const assignedCount = teamMembers.filter((member) => (openTaskCounts[member.name] ?? 0) > 0).length

  function openForm(member = null) {
    setEditingMember(member)
    setModalVersion((value) => value + 1)
    setModalOpen(true)
  }

  function saveMember(changes) {
    const duplicate = teamMembers.some((member) => (
      member.id !== editingMember?.id
      && (member.email.toLowerCase() === changes.email.toLowerCase() || member.name.toLowerCase() === changes.name.toLowerCase())
    ))
    if (duplicate) {
      setNotice('A team member with this name or email already exists.')
      window.setTimeout(() => setNotice(''), 2600)
      return
    }
    if (editingMember) {
      updateTeamMember(editingMember.id, changes)
      setNotice(`${changes.name}'s profile was updated.`)
    } else {
      addTeamMember({ ...changes, id: `member-${Date.now()}` })
      setNotice(`${changes.name} was added to the team.`)
    }
    setModalOpen(false)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <div className="animate-fade-in space-y-5 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">People & capacity</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Team</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Keep contact details, availability, and live task workload together.</p></div>
        {canManage && <Button type="button" onClick={() => openForm()}><UserPlus size={16} />Add member</Button>}
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card sm:grid-cols-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Team members</p><p className="mt-1 text-xl font-semibold text-slate-900">{teamMembers.length}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Available now</p><p className="mt-1 text-xl font-semibold text-slate-900">{availableCount}</p></div>
        <div className="border-slate-100 sm:border-l sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">With open tasks</p><p className="mt-1 text-xl font-semibold text-slate-900">{assignedCount}</p></div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, role, or email" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-brand-400" /></label>
        <select value={availability} onChange={(event) => setAvailability(event.target.value)} aria-label="Filter by availability" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none focus:border-brand-400"><option value="all">All availability</option><option value="available">Available</option><option value="limited">Limited</option><option value="leave">On leave</option></select>
      </div>

      {visibleMembers.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleMembers.map((member) => <MemberCard key={member.id} member={member} assignedCount={openTaskCounts[member.name] ?? 0} canEdit={canManage} onEdit={openForm} />)}</section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Users size={28} className="mx-auto text-slate-400" /><h2 className="mt-3 text-sm font-semibold text-slate-800">No matching team members</h2><button type="button" onClick={() => { setSearch(''); setAvailability('all') }} className="mt-3 text-xs font-semibold text-brand-700">Clear filters</button></section>
      )}

      <MemberModal key={`${editingMember?.id ?? 'new'}-${modalVersion}`} open={modalOpen} member={editingMember} onClose={() => setModalOpen(false)} onSave={saveMember} />
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[1100] flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-pop"><Check size={15} className="text-slate-600" />{notice}</div>}
    </div>
  )
}
