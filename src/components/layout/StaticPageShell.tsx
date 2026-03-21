'use client'
import { useRouter } from 'next/navigation'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import Logo from '@/components/ui/Logo'

const FOOTER_LINKS = {
  Product: [
    { label: 'Experience Shop', href: '/' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'FAQ', href: '/faq' },
  ],
  Industries: [
    { label: 'Banking', href: '/industries/banking' },
    { label: 'Insurance', href: '/industries/insurance' },
    { label: 'Healthcare', href: '/industries/healthcare' },
    { label: 'Telecom', href: '/industries/telecom' },
  ],
  Company: [
    { label: 'Contact Sales', href: '/contact-sales' },
    { label: 'Docs', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Compare', href: '/compare' },
  ],
}

export default function StaticPageShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg, #080D18)', color: 'var(--tx, #DDE6F5)' }}>
      {/* ── HEADER — same as homepage ── */}
      <UnifiedHeader
        variant="homepage"
        onSignIn={() => router.push('/login')}
        onLogoClick={() => router.push('/')}
        onGetStarted={() => router.push('/')}
        onMigrateClick={() => router.push('/migrate')}
        currency="USD"
        onCurrencyChange={() => {}}
      />

      {/* ── CONTENT ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="px-4 sm:px-6 py-10 sm:py-14" style={{ borderTop: '1px solid var(--b1, #1c2d45)' }}>
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size={28} showWordmark showTagline />
              <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--tx3)' }}>
                Transform your IVR to AI IVR. In 17 minutes. No IT. Zero integration.
              </p>
            </div>
            {Object.entries(FOOTER_LINKS).map(([cat, links]) => (
              <div key={cat}>
                <div className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--tx3)' }}>{cat}</div>
                {links.map(l => (
                  <a key={l.label} href={l.href} className="block text-[12px] no-underline mb-2 transition-colors hover:text-white" style={{ color: 'var(--tx2, #7a90b5)' }}>
                    {l.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderTop: '1px solid var(--b1, #1c2d45)' }}>
            <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>© 2026 AiIVRs. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="/privacy" className="text-[10px] no-underline" style={{ color: 'var(--tx3)' }}>Privacy</a>
              <a href="/terms" className="text-[10px] no-underline" style={{ color: 'var(--tx3)' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
