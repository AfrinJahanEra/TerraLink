import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthField, AuthShell } from '../components/login/AuthShell'
import { useApp } from '../hooks/useApp'

export function RegisterPage() {
  const { role, selectRole } = useApp()
  const [selected, setSelected] = useState('manager')
  const navigate = useNavigate()

  if (role) return <Navigate to="/dashboard" replace />

  function handleSubmit(event) {
    event.preventDefault()
    selectRole(selected)
    navigate('/dashboard')
  }

  return (
    <AuthShell
      eyebrow="Join the workspace"
      title="Create your account"
      description="Registration is instant in this prototype — enter any sample details and choose the role you want to explore."
      role={selected}
      onRoleChange={setSelected}
      submitLabel="Create account"
      onSubmit={handleSubmit}
      alternate={(
        <>
          Already have an account?
          <Link to="/login" className="font-semibold text-brand-700 transition hover:text-brand-800"> Log in</Link>
        </>
      )}
    >
      <AuthField label="Full name" type="text" placeholder="Your name" autoComplete="off" />
      <AuthField label="Email" type="email" placeholder="you@organisation.org" autoComplete="off" />
      <AuthField label="Organisation (optional)" type="text" placeholder="NGO or project team" autoComplete="off" />
      <AuthField label="Password" type="password" placeholder="Any sample password" autoComplete="off" />
    </AuthShell>
  )
}
