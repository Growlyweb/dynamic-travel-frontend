import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'

import PartnerAuthShell from '../components/PartnerAuthShell'
import { useAuth } from '@/hooks/useAuth'

export default function PartnerLogin() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    navigate(user?.role === 'partner' ? '/partner/portal' : '/dashboard', { replace: true })
  }, [isAuthenticated, user, navigate])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      setLoading(true)
      await login({ email, password, role: 'partner' })
      navigate('/partner/portal', { replace: true })
    } catch (err) {
      setError(err?.message || 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PartnerAuthShell
      title="Partner login"
      subtitle="Sign in to your approved B2B partner portal."
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-semibold text-slate-700">
          Email address
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="partner@company.com"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#2F80ED]"
            />
          </div>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Password
          <div className="relative mt-1.5">
            <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#2F80ED]"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2F80ED] text-sm font-bold text-white hover:bg-[#1d6fd0] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in to partner portal'} <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        New partner?{' '}
        <Link to="/partner/register" className="font-bold text-[#2F80ED] hover:underline">
          Apply for a partner account
        </Link>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
        Demo approved partner: <strong className="text-slate-600">amina@skylinetravels.test</strong> /{' '}
        <strong className="text-slate-600">partner123</strong>
      </div>
    </PartnerAuthShell>
  )
}
