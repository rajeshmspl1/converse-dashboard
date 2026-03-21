'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/industries', label: 'Industries' },
  { href: '/docs', label: 'Docs' },
]

export default function SiteNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex items-center justify-between px-4 sm:px-6 h-[52px] border-b sticky top-0 z-50"
      style={{
        borderColor: 'rgba(255,255,255,.06)',
        background: 'rgba(7,13,26,.96)',
        backdropFilter: 'blur(12px)',
      }}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 font-extrabold text-[15px] tracking-tight no-underline"
        style={{ color: 'var(--bright)' }}>
        <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-[13px]"
          style={{ background: 'linear-gradient(135deg,#3370e8,#0ea8b8)' }}>🎙</div>
        Converse<span style={{ color: '#3370e8' }}>AI</span>
      </Link>

      {/* Center links */}
      <div className="hidden md:flex items-center gap-7">
        {NAV_LINKS.map(link => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] no-underline transition-colors"
              style={{
                color: isActive ? '#fff' : 'rgba(255,255,255,.45)',
                fontWeight: isActive ? 600 : 400,
              }}>
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="hidden sm:block px-3 py-1.5 text-[11px] font-semibold rounded border"
          style={{ borderColor: 'var(--b2)', color: 'var(--text)', background: 'transparent' }}>
          Sign In
        </button>
        <Link href="/"
          className="px-4 py-1.5 text-[11px] font-bold rounded no-underline"
          style={{ background: '#3370e8', color: '#fff' }}>
          Try Live →
        </Link>
      </div>
    </nav>
  )
}
