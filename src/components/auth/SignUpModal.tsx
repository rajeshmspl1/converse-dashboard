'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { signup, verifyOtp, resendOtp, isLoggedIn, collectDemoSessionIds, claimDemoSessions, type SignupPayload } from '@/lib/auth'

// ── Design tokens (matches existing Converse AI theme) ──
const T = {
  teal: '#00c9b1', tealBg: 'rgba(0,201,177,.08)', tealBorder: 'rgba(0,201,177,.25)',
  blue: '#3370e8', purple: '#8b5cf6',
  red: '#f03060', redBg: 'rgba(240,48,96,.08)',
  amber: '#f5a623',
  tx: '#dde6f5', tx2: '#7a90b5', tx3: '#4a5f80',
  bg: '#080d18', s1: '#0d1526', s2: '#111d30', s3: '#16243a',
  b1: '#1c2d45', b2: '#243558',
  overlay: 'rgba(4,8,18,.85)',
}

interface SignUpModalProps {
  open: boolean
  onClose: () => void
  /** Where the signup was triggered from — sent to backend for analytics */
  source?: string
  /** Called after successful verification — user is now logged in */
  onSuccess?: () => void
  /** If set, redirect to this path after successful verification */
  redirectTo?: string
}

export default function SignUpModal({ open, onClose, source = 'homepage', onSuccess, redirectTo }: SignUpModalProps) {
  // ── State ──
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')

  // OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendCooldown, setResendCooldown] = useState(0)

  const backdropRef = useRef<HTMLDivElement>(null)

  // ── Reset on close ──
  useEffect(() => {
    if (!open) {
      // Delay reset so close animation can play
      const t = setTimeout(() => {
        setStep('form')
        setError('')
        setOtp(['', '', '', '', '', ''])
        setResendCooldown(0)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // ── Resend cooldown timer ──
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  // ── Auto-focus first OTP input ──
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }, [step])

  // ── Close on backdrop click ──
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }, [onClose])

  // ── Close on Escape ──
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ── Submit signup form ──
  const handleSignup = async () => {
    setError('')

    // Client-side validation
    if (!fullName.trim()) return setError('Please enter your full name')
    if (!mobile.trim() || mobile.trim().length < 6) return setError('Please enter a valid mobile number')
    if (!companyName.trim()) return setError('Please enter your company name')
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email')

    setLoading(true)
    try {
      const payload: SignupPayload = {
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        company_name: companyName.trim(),
        email: email.trim().toLowerCase(),
        source,
      }
      await signup(payload)
      setStep('otp')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit OTP ──
  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) return setError('Please enter the full 6-digit code')

    setError('')
    setLoading(true)
    try {
      await verifyOtp(email.trim().toLowerCase(), code)
      // Claim any demo sessions from this browser (fire-and-forget)
      const demoIds = collectDemoSessionIds()
      if (demoIds.length) claimDemoSessions(demoIds).catch(() => {})
      // Success! User is now logged in
      onSuccess?.()
      onClose()
      // Redirect if a target was specified (e.g. /migrate)
      if (redirectTo) {
        window.location.href = redirectTo
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed')
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ──
  const handleResend = async () => {
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

  // ── OTP input handlers ──
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return // digits only
    const digit = val.slice(-1) // take last char if pasting
    const newOtp = [...otp]
    newOtp[idx] = digit
    setOtp(newOtp)
    // Auto-advance
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
    // Auto-submit when all 6 filled
    if (digit && idx === 5 && newOtp.every(d => d)) {
      setTimeout(() => handleVerify(), 100)
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'Enter') handleVerify()
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
    if (newOtp.every(d => d)) setTimeout(() => handleVerify(), 100)
  }

  if (!open) return null

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: T.overlay, backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease-out' }}>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
      `}</style>

      <div
        className="w-full max-w-[420px] rounded-2xl border overflow-hidden"
        style={{
          background: T.s1,
          borderColor: T.b1,
          boxShadow: `0 24px 80px rgba(0,0,0,.6), 0 0 0 1px ${T.b1}, inset 0 1px 0 rgba(255,255,255,.03)`,
          animation: 'slideUp .3s ease-out',
        }}>

        {/* ── Header ── */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-[14px] transition-all hover:scale-110"
            style={{ background: T.s2, color: T.tx3, border: `1px solid ${T.b1}` }}>
            ✕
          </button>

          {/* Logo + title */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold"
              style={{ background: 'linear-gradient(135deg,#3370e8,#0ea8b8)' }}>🎙</div>
            <div>
              <div className="text-[14px] font-bold" style={{ color: T.tx }}>
                Converse<span style={{ color: '#3370e8' }}>AI</span>
              </div>
              <div className="text-[10px]" style={{ color: T.tx3 }}>
                {step === 'form' ? 'Create your free account' : 'Verify your email'}
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: step === 'form' ? T.teal : 'transparent',
                  border: `2px solid ${T.teal}`,
                  color: step === 'form' ? '#000' : T.teal,
                }}>1</div>
              <span className="text-[10px] font-medium" style={{ color: step === 'form' ? T.teal : T.tx3 }}>Details</span>
            </div>
            <div className="w-8 h-px" style={{ background: step === 'otp' ? T.teal : T.b2 }} />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: step === 'otp' ? T.teal : 'transparent',
                  border: `2px solid ${step === 'otp' ? T.teal : T.b2}`,
                  color: step === 'otp' ? '#000' : T.tx3,
                }}>2</div>
              <span className="text-[10px] font-medium" style={{ color: step === 'otp' ? T.teal : T.tx3 }}>Verify</span>
            </div>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-lg text-[11px]"
            style={{ background: T.redBg, color: T.red, border: `1px solid ${T.red}22` }}>
            {error}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 1: SIGNUP FORM
            ══════════════════════════════════════════ */}
        {step === 'form' && (
          <div className="px-6 pb-6">
            <div className="flex flex-col gap-3">
              {/* Full Name */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: T.tx3 }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignup()}
                  placeholder="Rajesh Kumar"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                  style={{
                    background: T.s2, color: T.tx,
                    border: `1px solid ${T.b2}`,
                  }}
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: T.tx3 }}>Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignup()}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                  style={{
                    background: T.s2, color: T.tx,
                    border: `1px solid ${T.b2}`,
                  }}
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: T.tx3 }}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignup()}
                  placeholder="HDFC Bank"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                  style={{
                    background: T.s2, color: T.tx,
                    border: `1px solid ${T.b2}`,
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: T.tx3 }}>Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignup()}
                  placeholder="rajesh@hdfc.com"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                  style={{
                    background: T.s2, color: T.tx,
                    border: `1px solid ${T.b2}`,
                  }}
                />
                <div className="text-[9px] mt-1" style={{ color: T.tx3 }}>
                  We'll send a verification code to this email
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl text-[14px] font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
              style={{
                background: loading
                  ? `linear-gradient(90deg, ${T.teal}80, ${T.blue}80, ${T.teal}80)`
                  : T.teal,
                backgroundSize: loading ? '200% 100%' : 'auto',
                animation: loading ? 'shimmer 1.5s linear infinite' : 'none',
                color: '#000', border: 'none', cursor: loading ? 'wait' : 'pointer',
                boxShadow: `0 4px 16px rgba(0,201,177,.25)`,
              }}>
              {loading ? 'Sending code…' : 'Get Verification Code →'}
            </button>

            {/* Fine print */}
            <div className="text-center mt-3 text-[9px]" style={{ color: T.tx3 }}>
              Free forever for testing · No credit card · Cancel anytime
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 2: OTP VERIFICATION
            ══════════════════════════════════════════ */}
        {step === 'otp' && (
          <div className="px-6 pb-6">
            {/* Info */}
            <div className="text-center mb-5">
              <div className="text-[28px] mb-2">📧</div>
              <div className="text-[13px] font-semibold mb-1" style={{ color: T.tx }}>
                Check your email
              </div>
              <div className="text-[11px]" style={{ color: T.tx2 }}>
                We sent a 6-digit code to{' '}
                <span className="font-semibold" style={{ color: T.teal }}>{email}</span>
              </div>
            </div>

            {/* OTP inputs */}
            <div className="flex gap-2 justify-center mb-4" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-11 h-13 text-center text-[22px] font-bold font-mono rounded-xl outline-none transition-all"
                  style={{
                    background: digit ? T.s3 : T.s2,
                    color: T.tx,
                    border: digit ? `2px solid ${T.teal}50` : `2px solid ${T.b2}`,
                    caretColor: T.teal,
                  }}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length < 6}
              className="w-full py-3 rounded-xl text-[14px] font-bold transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
              style={{
                background: loading
                  ? `linear-gradient(90deg, ${T.teal}80, ${T.blue}80, ${T.teal}80)`
                  : T.teal,
                backgroundSize: loading ? '200% 100%' : 'auto',
                animation: loading ? 'shimmer 1.5s linear infinite' : 'none',
                color: '#000', border: 'none',
                cursor: loading ? 'wait' : otp.join('').length < 6 ? 'not-allowed' : 'pointer',
                boxShadow: otp.join('').length === 6 ? `0 4px 16px rgba(0,201,177,.25)` : 'none',
              }}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>

            {/* Resend */}
            <div className="flex items-center justify-center gap-2 mt-4 text-[11px]">
              <span style={{ color: T.tx3 }}>Didn't get the code?</span>
              {resendCooldown > 0 ? (
                <span className="font-mono" style={{ color: T.tx3 }}>
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="font-semibold transition-colors hover:underline"
                  style={{ background: 'none', border: 'none', color: T.teal, cursor: 'pointer', fontSize: '11px' }}>
                  Resend code
                </button>
              )}
            </div>

            {/* Change email */}
            <div className="text-center mt-2">
              <button
                onClick={() => { setStep('form'); setError(''); setOtp(['', '', '', '', '', '']) }}
                className="text-[10px] transition-colors hover:underline"
                style={{ background: 'none', border: 'none', color: T.tx3, cursor: 'pointer' }}>
                ← Change email address
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
