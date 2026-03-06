'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, isLoggedIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (isLoggedIn()) router.replace('/dashboard')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .login-card { animation: fadeUp .4s ease-out; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #0f1824 inset !important; -webkit-text-fill-color: #a8c0e0 !important; }
      `}</style>

      <div className="login-card w-full max-w-sm px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px]"
            style={{ background: 'linear-gradient(135deg,#3370e8,#0ea8b8)' }}>🎙</div>
          <span className="font-extrabold text-[18px] tracking-tight" style={{ color: 'var(--bright)' }}>
            Converse AI
          </span>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--b1)' }}>
          <div className="mb-5">
            <div className="font-bold text-[15px] mb-1" style={{ color: 'var(--bright)' }}>Sign in to your dashboard</div>
            <div className="text-[11px]" style={{ color: 'var(--dim)' }}>CX Analytics & Intelligence</div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@hdfc.com"
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none transition-all"
                style={{ background: 'var(--card2)', border: '1px solid var(--b2)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = '#3370e8'}
                onBlur={e  => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none transition-all"
                style={{ background: 'var(--card2)', border: '1px solid var(--b2)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = '#3370e8'}
                onBlur={e  => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>

            {error && (
              <div className="text-[11px] px-3 py-2 rounded-lg"
                style={{ background: 'rgba(212,68,68,.1)', color: '#f87171', border: '1px solid rgba(212,68,68,.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-bold text-[13px] mt-1 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#3370e8', color: '#fff' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <div className="text-center text-[10px] mt-4" style={{ color: 'var(--dim)' }}>
          Converse AI · CX Manager Portal
        </div>
      </div>
    </div>
  )
}
