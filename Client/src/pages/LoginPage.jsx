import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthField, AuthShell } from '../components/login/AuthShell'
import { useApp } from '../hooks/useApp'

export function LoginPage() {
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
      eyebrow="Welcome back"
      title="Log in to the workspace"
      description="This prototype performs no real authentication — any sample email and password will work. Pick the role you want to explore."
      role={selected}
      onRoleChange={setSelected}
      submitLabel="Log in"
      onSubmit={handleSubmit}
      alternate={(
        <>
          New to TerraLink?
          <Link to="/register" className="font-semibold text-brand-700 transition hover:text-brand-800"> Create an account</Link>
        </>
      )}
    >
      <AuthField label="Email" type="email" placeholder="you@organisation.org" autoComplete="off" />
      <AuthField label="Password" type="password" placeholder="Any sample password" autoComplete="off" />
    </AuthShell>
  )
}
