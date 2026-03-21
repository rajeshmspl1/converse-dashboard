'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { login, isLoggedIn, resendOtp, verifyOtp } from '@/lib/auth'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import Logo from '@/components/ui/Logo'
import SignUpModal from '@/components/auth/SignUpModal'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)

  // OTP mode — activated when account uses email verification
  const [otpMode, setOtpMode] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (isLoggedIn()) window.location.href = '/dashboard'
  }, [router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  useEffect(() => {
    if (otpMode && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }, [otpMode])

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      window.location.href = '/dashboard'
    } catch (err: any) {
      const msg = err.message || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Switch to OTP mode manually
  async function switchToOtpMode() {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter your email first, then click "Sign in with code"')
      return
    }
    setError('')
    setLoading(true)
    try {
      await resendOtp(email.trim().toLowerCase())
      setOtpMode(true)
      setResendCooldown(60)
    } catch (otpErr: any) {
      setError(otpErr.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join('')
    if (code.length < 6) return setError('Please enter the full 6-digit code')
    setError('')
    setLoading(true)
    try {
      await verifyOtp(email.trim().toLowerCase(), code)
      // Hard redirect — router.replace can fail silently
      window.location.href = '/migrate'
    } catch (err: any) {
      setError(err.message || 'Verification failed')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError('')
    try {
      await resendOtp(email.trim().toLowerCase())
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const digit = val.slice(-1)
    const newOtp = [...otp]
    newOtp[idx] = digit
    setOtp(newOtp)
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (digit && idx === 5 && newOtp.every(d => d)) setTimeout(() => handleVerifyOtp(), 100)
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
    if (e.key === 'Enter') handleVerifyOtp()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const newOtp = [...otp]
    text.split('').forEach((d, i) => { if (i < 6) newOtp[i] = d })
    setOtp(newOtp)
    const nextEmpty = newOtp.findIndex(d => !d)
    otpRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus()
    if (newOtp.every(d => d)) setTimeout(() => handleVerifyOtp(), 100)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .login-card { animation: fadeUp .4s ease-out; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #0f1824 inset !important; -webkit-text-fill-color: #a8c0e0 !important; }
      `}</style>

      <UnifiedHeader
        variant="homepage"
        onSignIn={() => {}}
        onGetStarted={() => router.push('/')}
        onMigrateClick={() => setShowSignUp(true)}
      />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="login-card w-full max-w-md">
          <div className="rounded-2xl border p-8 sm:p-10" style={{ background: 'var(--card)', borderColor: 'var(--b1)' }}>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Logo size={32} showWordmark={true} className="justify-center" />
            </div>
            <div className="mb-6 text-center">
              <div className="font-bold text-[17px] mb-1" style={{ color: 'var(--bright)' }}>
                {otpMode ? 'Verify your email' : 'Sign in to your dashboard'}
              </div>
              <div className="text-[12px]" style={{ color: 'var(--dim)' }}>
                {otpMode ? (<>We sent a 6-digit code to <span style={{ color: '#00c9b1', fontWeight: 600 }}>{email}</span></>) : 'CX Analytics & Intelligence'}
              </div>
            </div>

            {error && (
              <div className="text-[12px] px-4 py-3 rounded-lg mb-4"
                style={{ background: 'rgba(212,68,68,.1)', color: '#f87171', border: '1px solid rgba(212,68,68,.2)' }}>
                {error}
              </div>
            )}

            {!otpMode && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Company Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-lg text-[13px] outline-none transition-all"
                    style={{ background: 'var(--card2)', border: '1px solid var(--b2)', color: 'var(--text)' }}
                    onFocus={e => e.target.style.borderColor = '#3370e8'} onBlur={e => e.target.style.borderColor = 'var(--b2)'} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 rounded-lg text-[13px] outline-none transition-all"
                      style={{ background: 'var(--card2)', border: '1px solid var(--b2)', color: 'var(--text)' }}
                      onFocus={e => e.target.style.borderColor = '#3370e8'} onBlur={e => e.target.style.borderColor = 'var(--b2)'} />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold"
                      style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer' }}>
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={handleSubmit} disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-[14px] mt-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#3370e8', color: '#fff' }}>
                  {loading ? 'Signing in\u2026' : 'Sign In \u2192'}
                </button>
                <div className="text-center mt-3">
                  <button type="button" onClick={switchToOtpMode} disabled={loading}
                    className="text-[11px] font-semibold transition-colors hover:underline disabled:opacity-50"
                    style={{ background: 'none', border: 'none', color: '#00c9b1', cursor: 'pointer' }}>
                    📧 Sign in with email code instead
                  </button>
                </div>
              </div>
            )}

            {otpMode && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el }} type="text" inputMode="numeric" maxLength={1}
                      value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-13 text-center text-[22px] font-bold font-mono rounded-xl outline-none transition-all"
                      style={{ background: digit ? '#16243a' : '#111d30', color: '#dde6f5', border: digit ? '2px solid rgba(0,201,177,.3)' : '2px solid #243558', caretColor: '#00c9b1' }} />
                  ))}
                </div>
                <button onClick={handleVerifyOtp} disabled={loading || otp.join('').length < 6}
                  className="w-full py-3 rounded-lg font-bold text-[14px] transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#00c9b1', color: '#000' }}>
                  {loading ? 'Verifying\u2026' : 'Verify & Sign In'}
                </button>
                <div className="flex items-center justify-center gap-2 text-[11px]">
                  <span style={{ color: '#4a5f80' }}>Didn't get the code?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-mono" style={{ color: '#4a5f80' }}>Resend in {resendCooldown}s</span>
                  ) : (
                    <button onClick={handleResend} className="font-semibold hover:underline"
                      style={{ background: 'none', border: 'none', color: '#00c9b1', cursor: 'pointer', fontSize: '11px' }}>Resend code</button>
                  )}
                </div>
                <div className="text-center">
                  <button onClick={() => { setOtpMode(false); setError(''); setOtp(['', '', '', '', '', '']) }}
                    className="text-[10px] hover:underline"
                    style={{ background: 'none', border: 'none', color: '#4a5f80', cursor: 'pointer' }}>
                    ← Back to password login
                  </button>
                </div>
              </div>
            )}

            <div className="text-center text-[11px] mt-5 pt-4" style={{ color: 'var(--dim)', borderTop: '1px solid var(--b1)' }}>
              Don't have an account?{' '}
              <a href="/" className="font-semibold" style={{ color: '#00c9b1', textDecoration: 'none' }}>Try a free demo →</a>
            </div>
          </div>
          <div className="text-center text-[10px] mt-4" style={{ color: 'var(--dim)' }}>AiIVRs · CX Manager Portal</div>
        </div>
      </div>

      <SignUpModal open={showSignUp} onClose={() => setShowSignUp(false)} source="login_migrate" redirectTo="/migrate" />
    </div>
  )
}
