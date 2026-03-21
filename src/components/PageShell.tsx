'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, clearAuth, type CxUser } from '@/lib/auth'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import SignUpModal from '@/components/auth/SignUpModal'

export default function PageShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<CxUser | null>(null)
  const [showSignUp, setShowSignUp] = useState(false)

  useEffect(() => { setUser(getUser()) }, [])

  const handleSignOut = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)', overflow: 'auto' }}>
      <UnifiedHeader
        variant="homepage"
        user={user}
        onSignIn={() => router.push('/login')}
        onSignOut={handleSignOut}
        onGetStarted={() => setShowSignUp(true)}
      />

      <main className="flex-1">{children}</main>

      {/* Footer CTA — shared across all static pages */}
      <div className="px-6 py-10" style={{ background: 'var(--bg)' }}>
        <div className="max-w-[800px] mx-auto text-center rounded-2xl p-10 border"
          style={{
            background: 'linear-gradient(135deg, rgba(51,112,232,.06), rgba(14,168,184,.04))',
            borderColor: 'rgba(51,112,232,.12)',
          }}>
          <h2 className="text-[22px] font-bold mb-2" style={{ color: 'var(--bright)' }}>
            Ready to migrate your IVR? 17 minutes from now.
          </h2>
          <p className="text-[13px] mb-6" style={{ color: 'var(--dim)' }}>
            Your customers deserve a better experience. There's no reason to wait.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/"
              className="px-8 py-3 rounded-xl font-bold text-[14px] no-underline"
              style={{ background: 'var(--green)', color: '#050e1a' }}>
              📞 Start a Call Now
            </Link>
            <button
              onClick={() => setShowSignUp(true)}
              className="px-8 py-3 rounded-xl font-semibold text-[14px] border cursor-pointer"
              style={{ borderColor: 'var(--b2)', color: 'var(--text)', background: 'transparent' }}>
              🔄 Migrate Your IVR
            </button>
          </div>
          <div className="flex gap-5 justify-center mt-4 text-[11px] flex-wrap"
            style={{ color: 'var(--dim)' }}>
            <span>✓ No credit card</span>
            <span>✓ Free UAT 3 months</span>
            <span>✓ Your IVR stays live</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-[10px]" style={{ color: 'var(--dim)' }}>
        Zero cost · No credit card · Converse AI © 2026
      </div>

      {/* SignUp modal — available on all pages */}
      <SignUpModal
        open={showSignUp}
        onClose={() => setShowSignUp(false)}
        source="static_page"
        onSuccess={() => setUser(getUser())}
      />
    </div>
  )
}
