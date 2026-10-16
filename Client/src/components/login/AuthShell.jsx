import { ArrowRight, Building2, Check, Eye, EyeOff, Lock, Mail, Map as MapIcon, UserRound } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import wetlandImage from '../../assets/bangladesh-wetland-hero.png'
import { ROLE_LIST, ROLES } from '../../constants/roles'
import { cn } from '../../utils/cn'
import { Logo } from '../brand/Logo'

const TAGLINES = {
  manager: 'Reviews and approves',
  coordinator: 'Field work and costs',
  user: 'Reports problems',
}

const FACTS = [
  ['5', 'Dhaka water bodies'],
  ['10 m', 'Sentinel-2 imagery'],
  ['Photo', 'community reports'],
]

const DEMO_PASSWORD = 'demo-password'
const emailPattern = /^\S+@\S+\.\S+$/

function Field({ id, label, icon: Icon, error, hint, action, children }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700">{label}</label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <div className="relative mt-1.5">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
        {children}
        {action}
      </div>
      {error && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  )
}

const inputClass = (hasIcon, hasError) => cn(
  'h-11 w-full rounded-lg border bg-white pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
  hasIcon ? 'pl-10' : 'pl-3.5',
  hasError ? 'border-rose-300' : 'border-slate-200',
)

/**
 * Split-screen sign-in and registration layout. The left side explains what the chosen role can do;
 * the right side is the form. Demo details are filled in for the chosen role, and can be edited.
 */
export function AuthShell({ mode, role, onRoleChange, onSubmit, alternateTo }) {
  const isRegister = mode === 'register'
  const chosen = ROLES[role]
  const [email, setEmail] = useState(chosen.user.email)
  const [name, setName] = useState(chosen.user.name)
  const [organisation, setOrganisation] = useState('')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  // Demo details follow the chosen role until the person types their own.
  const edited = useRef({ email: false, name: false })

  function chooseRole(id) {
    onRoleChange(id)
    if (!edited.current.email) setEmail(ROLES[id].user.email)
    if (!edited.current.name) setName(ROLES[id].user.name)
  }

  function submit(event) {
    event.preventDefault()
    const found = {}
    if (isRegister && name.trim().length < 2) found.name = 'Enter your full name.'
    if (!emailPattern.test(email.trim())) found.email = 'Enter a valid email address.'
    if (password.length < 6) found.password = 'Use at least 6 characters.'
    setErrors(found)
    if (!Object.keys(found).length) onSubmit(event)
  }

  const title = isRegister ? 'Create your account' : 'Welcome back'
  const subtitle = isRegister ? 'Choose how you will use TerraLink and register in a few seconds.' : 'Log in to continue. Choose how you want to use TerraLink.'

  return (
    <main className="grid min-h-svh bg-white lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-950 text-white lg:flex lg:flex-col">
        <img src={wetlandImage} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-950/90 to-brand-900/60" />
        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <Link to="/" className="w-fit" aria-label="TerraLink home"><Logo inverse /></Link>

          <div className="max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">From orbit to the field</p>
            <h2 className="mt-4 text-[34px] font-bold leading-[1.12] tracking-tight xl:text-[40px]">One workspace from satellite signal to field report.</h2>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-white/70">Measure water bodies from dated Sentinel-2 imagery, verify what residents report, and turn it into costed, accountable work.</p>

            <div className="mt-8 rounded-xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm" aria-live="polite">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300">As {chosen.label}</p>
              <ul className="mt-3 space-y-2.5">
                {chosen.capabilities.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/85">
                    <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-brand-400/25 text-brand-200"><Check size={11} strokeWidth={3} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <dl className="grid grid-cols-3 gap-4 border-t border-white/15 pt-5">
              {FACTS.map(([value, label]) => <div key={label}><dt className="text-xl font-bold tracking-tight">{value}</dt><dd className="mt-0.5 text-xs text-white/60">{label}</dd></div>)}
            </dl>
            <p className="mt-5 text-[11px] text-white/45">Interactive prototype. Sample data and no real authentication.</p>
          </div>
        </div>
      </aside>

      <section className="flex flex-col bg-slate-50 lg:bg-white">
        <div className="flex items-center justify-between bg-brand-950 px-5 py-3.5 lg:hidden">
          <Link to="/" aria-label="TerraLink home"><Logo inverse /></Link>
          <Link to="/" className="text-xs font-semibold text-brand-100/80 hover:text-white">Back to home</Link>
        </div>
        <div className="hidden justify-end px-10 pt-7 lg:flex">
          <Link to="/" className="text-xs font-semibold text-slate-500 transition hover:text-slate-900">Back to home</Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-7 sm:px-8 lg:py-6">
          <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{subtitle}</p>

            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              <fieldset>
                <legend className="text-xs font-semibold text-slate-700">Continue as</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ROLE_LIST.map((item) => {
                    const Icon = item.icon
                    const active = role === item.id
                    return (
                      <button key={item.id} type="button" onClick={() => chooseRole(item.id)} aria-pressed={active} className={cn('flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition last:odd:col-span-2', active ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50')}>
                        <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', active ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500')}><Icon size={16} /></span>
                        <span className="min-w-0"><span className="block text-[13px] font-semibold leading-4 text-slate-900">{item.label}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{TAGLINES[item.id]}</span></span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2.5 text-[11px] leading-5 text-slate-500">{chosen.description} You will continue as <strong className="font-semibold text-slate-700">{chosen.user.name}</strong>, the demo identity for this role.</p>
              </fieldset>

              {isRegister && (
                <Field id="auth-name" label="Full name" icon={UserRound} error={errors.name}>
                  <input id="auth-name" value={name} onChange={(event) => { edited.current.name = true; setName(event.target.value) }} autoComplete="name" placeholder="Your full name" className={inputClass(true, errors.name)} />
                </Field>
              )}

              <Field id="auth-email" label="Email" icon={Mail} error={errors.email}>
                <input id="auth-email" type="email" value={email} onChange={(event) => { edited.current.email = true; setEmail(event.target.value) }} autoComplete="email" placeholder="you@example.com" className={inputClass(true, errors.email)} />
              </Field>

              {isRegister && (
                <Field id="auth-org" label="Organisation" icon={Building2} hint="Optional">
                  <input id="auth-org" value={organisation} onChange={(event) => setOrganisation(event.target.value)} autoComplete="organization" placeholder="NGO or project team" className={inputClass(true, false)} />
                </Field>
              )}

              <Field
                id="auth-password"
                label="Password"
                icon={Lock}
                error={errors.password}
                action={<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
              >
                <input id="auth-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="At least 6 characters" className={cn(inputClass(true, errors.password), 'pr-11')} />
              </Field>

              <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800">
                {isRegister ? 'Create account' : 'Log in'}<ArrowRight size={16} />
              </button>
            </form>

            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500">Demo details are filled in for the role you choose. This prototype performs no real authentication, so any valid-looking email and password work.</p>

            <div className="mt-5 flex flex-col items-center gap-2.5 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <p>{isRegister ? 'Already have an account?' : 'New to TerraLink?'} <Link to={alternateTo} className="font-semibold text-brand-700 transition hover:text-brand-800">{isRegister ? 'Log in' : 'Create an account'}</Link></p>
              <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"><MapIcon size={14} />Explore the map without signing in</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
