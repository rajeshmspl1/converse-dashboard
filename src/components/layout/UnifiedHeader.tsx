'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { T, BRAND, GRADIENTS, HEADER, FONTS } from '@/lib/theme'
import { CURRENCY_CONFIG } from '@/lib/data'
import Logo from '@/components/ui/Logo'
import type { Currency } from '@/types'

// ═══════════════════════════════════════════════════════════════════
// UnifiedHeader — One header for all pages (Brand Guide §4.1)
// Variants: homepage | journey | dashboard | session
// ═══════════════════════════════════════════════════════════════════

interface HeaderProps {
  variant: 'homepage' | 'journey' | 'dashboard' | 'session'
  user?: { full_name?: string; email: string; role: string; tenant_key?: string } | null
  onSignIn?: () => void
  onSignOut?: () => void
  onLogoClick?: () => void
  onGetStarted?: () => void
  onAccount?: () => void
  onSettings?: () => void
  /** Called when "Migrate Your IVR" nav link is clicked. If not provided, navigates to /migrate directly. */
  onMigrateClick?: () => void
  tabs?: { key: string; label: string }[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  tenantLabel?: string
  sessionLabel?: string
  currency?: Currency
  onCurrencyChange?: (c: Currency) => void
}

export default function UnifiedHeader({
  variant, user, onSignIn, onSignOut, onLogoClick, onGetStarted,
  onAccount, onSettings, onMigrateClick,
  tabs, activeTab, onTabChange,
  tenantLabel, sessionLabel,
  currency = 'inr', onCurrencyChange,
}: HeaderProps) {
  const router = useRouter()
  const [currencyDropdown, setCurrencyDropdown] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const isLoggedIn = !!user
  const isHomepage = variant === 'homepage'
  const isJourney = variant === 'journey'
  const showTabs = variant === 'dashboard' || variant === 'session'
  const showBackHome = variant === 'dashboard' || variant === 'session'

  const handleLogoClick = useCallback(() => {
    if (onLogoClick) onLogoClick()
    else router.push('/')
  }, [onLogoClick, router])

  // Close user menu on click outside
  useEffect(() => {
    if (!userMenu) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenu])

  const closeCurrencyDropdown = () => {
    if (currencyDropdown) setCurrencyDropdown(false)
  }

  const toggleCurrencyDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrencyDropdown(prev => !prev)
  }

  const selectCurrency = (c: Currency) => {
    if (onCurrencyChange) onCurrencyChange(c)
    setCurrencyDropdown(false)
  }

  return (
    <nav
      className="flex items-center justify-between px-4 sm:px-6 border-b flex-shrink-0 sticky top-0"
      style={{
        height: HEADER.height,
        borderColor: T.b1,
        background: HEADER.bg,
        backdropFilter: HEADER.blur,
        zIndex: HEADER.zIndex,
        fontFamily: FONTS.ui,
      }}
      onClick={closeCurrencyDropdown}
    >
      {/* ── LEFT: Logo + context ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleLogoClick}>
          <Logo size={HEADER.logoSize} showWordmark={true} showTagline={true} />
        </div>

        {showBackHome && (
          <React.Fragment>
            <a
              href="/"
              className="text-[11px] px-2.5 py-1 rounded hover:opacity-80"
              style={{
                color: T.tx2,
                background: T.s2,
                border: '1px solid ' + T.b1,
                textDecoration: 'none',
              }}
            >
              ← Home
            </a>
            <span className="hidden sm:block w-px h-5" style={{ background: T.b1 }} />
          </React.Fragment>
        )}

        {variant === 'dashboard' && tenantLabel && (
          <span
            className="hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded"
            style={{ background: T.s2, border: '1px solid ' + T.b1, color: T.tx2 }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.teal }} />
            {tenantLabel}
          </span>
        )}

        {variant === 'session' && sessionLabel && (
          <span
            className="hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded"
            style={{ background: T.s2, border: '1px solid ' + T.b1, color: T.tx2 }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.teal }} />
            {sessionLabel}
          </span>
        )}
      </div>

      {/* ── CENTER: Nav links (homepage) or Tabs (dashboard/session) ── */}
      {(isHomepage || isJourney) && (
        <div className="hidden md:flex items-center gap-4 lg:gap-7 absolute left-1/2 -translate-x-1/2">
          {['Product', 'Pricing', 'Industries', 'Docs', 'Dashboard'].map(link => (
            <a
              key={link}
              className="text-[13px] lg:text-[14px] cursor-pointer transition-colors hover:text-white whitespace-nowrap"
              style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none' }}
              onClick={() => {
                if (link === 'Dashboard') {
                  if (isLoggedIn) {
                    router.push('/dashboard')
                  } else {
                    // Find latest anonymous session from sessionStorage
                    let latestKey = ''
                    let latestTs = 0
                    for (let i = 0; i < sessionStorage.length; i++) {
                      const k = sessionStorage.key(i) || ''
                      if (k.startsWith('cvs_session_CVS-')) {
                        const ts = parseInt(k.replace('cvs_session_CVS-', ''), 10)
                        if (ts > latestTs) { latestTs = ts; latestKey = k.replace('cvs_session_', '') }
                      }
                    }
                    if (latestKey) {
                      window.location.href = `/dashboard/session/${latestKey}`
                    } else {
                      window.location.href = '/dashboard/session/CVS-preview'
                    }
                  }
                }
                else if (link !== 'Product') router.push('/' + link.toLowerCase())
              }}
            >
              {link}
            </a>
          ))}
          <a
            className="text-[13px] lg:text-[14px] cursor-pointer transition-colors hover:text-white whitespace-nowrap font-semibold flex flex-col items-center leading-[1.15]"
            style={{ color: BRAND.teal, textDecoration: 'none' }}
            onClick={() => {
              const el = document.getElementById('integrations')
              if (el) {
                // Walk up to find the overflow-y-auto scroll container
                let sp: HTMLElement | null = el.parentElement
                while (sp) {
                  const ov = window.getComputedStyle(sp).overflowY
                  if (ov === 'auto' || ov === 'scroll') break
                  sp = sp.parentElement
                }
                if (sp) {
                  // Calculate offset relative to scroll container
                  let offset = 0
                  let node: HTMLElement | null = el
                  while (node && node !== sp) { offset += node.offsetTop; node = node.offsetParent as HTMLElement }
                  sp.scrollTo({ top: Math.max(0, offset - 60), behavior: 'smooth' })
                } else {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              } else {
                router.push('/')
                setTimeout(() => {
                  const e = document.getElementById('integrations')
                  if (e) {
                    let sp2: HTMLElement | null = e.parentElement
                    while (sp2) { const ov = window.getComputedStyle(sp2).overflowY; if (ov === 'auto' || ov === 'scroll') break; sp2 = sp2.parentElement }
                    if (sp2) { let off = 0; let nd: HTMLElement | null = e; while (nd && nd !== sp2) { off += nd.offsetTop; nd = nd.offsetParent as HTMLElement }; sp2.scrollTo({ top: Math.max(0, off - 60), behavior: 'smooth' }) }
                    else e.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 600)
              }
            }}
          >
            <span style={{ fontSize: 11, lineHeight: 1.2 }}>Zero Integration</span>
            <span style={{ fontSize: 11, lineHeight: 1.2, opacity: 0.7 }}>Ecosystem</span>
          </a>
          <a
            className="text-[13px] lg:text-[14px] cursor-pointer transition-colors font-semibold whitespace-nowrap"
            style={{ color: BRAND.teal, textDecoration: 'none' }}
            onClick={() => {
              if (onMigrateClick) onMigrateClick()
              else router.push('/migrate')
            }}
          >
            Migrate Your IVR
          </a>
        </div>
      )}

      {showTabs && tabs && (
        <div className="flex items-center gap-0.5 flex-1 mx-3 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => onTabChange?.(t.key)}
              className="px-3.5 py-2 rounded text-[12px] font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === t.key ? T.teal2 : 'transparent',
                color: activeTab === t.key ? BRAND.teal : T.tx2,
                border: activeTab === t.key
                  ? '1px solid ' + BRAND.teal + '40'
                  : '1px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── RIGHT: Currency + Auth ── */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">

        {/* Migrate link for dashboard/session (nav links hidden in these variants) */}
        {showTabs && (
          <a
            className="text-[12px] cursor-pointer transition-colors font-semibold mr-2 hidden lg:block whitespace-nowrap"
            style={{ color: BRAND.teal, textDecoration: 'none' }}
            onClick={() => {
              if (onMigrateClick) onMigrateClick()
              else router.push('/migrate')
            }}
          >
            Migrate Your IVR
          </a>
        )}

        {/* Currency toggle */}
        {onCurrencyChange && (
          <div
            className="flex rounded overflow-hidden border relative"
            style={{ background: T.s1, borderColor: T.b1 }}
          >
            {(['inr', 'usd'] as const).map(c => (
              <button
                key={c}
                onClick={() => onCurrencyChange(c)}
                className="px-1.5 sm:px-2.5 py-[3px] text-[9px] sm:text-[10px] font-bold transition-all"
                style={{
                  fontFamily: FONTS.mono,
                  background: currency === c ? BRAND.blue : 'transparent',
                  color: currency === c ? '#fff' : T.tx3,
                }}
              >
                {CURRENCY_CONFIG[c].flag} {CURRENCY_CONFIG[c].label}
              </button>
            ))}
            <button
              onClick={toggleCurrencyDropdown}
              className="px-1 py-[3px] text-[9px] font-bold border-l transition-all"
              style={{ borderColor: T.b1, color: T.tx3 }}
            >
              ▾
            </button>
            {currencyDropdown && (
              <div
                className="absolute top-full right-0 mt-1 rounded-lg border shadow-xl z-50 min-w-[110px]"
                style={{ background: T.s1, borderColor: T.b2 }}
                onClick={e => e.stopPropagation()}
              >
                {(['eur', 'gbp', 'aed', 'sgd', 'jpy', 'aud'] as Currency[]).map(c => (
                  <button
                    key={c}
                    onClick={() => selectCurrency(c)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[9px] hover:bg-white/5"
                    style={{
                      fontFamily: FONTS.mono,
                      color: currency === c ? BRAND.blue : T.tx,
                    }}
                  >
                    {CURRENCY_CONFIG[c].flag}{' '}
                    <span className="font-bold">{CURRENCY_CONFIG[c].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auth — logged in: avatar + dropdown */}
        {isLoggedIn && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenu(prev => !prev)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all"
              style={{
                background: userMenu ? T.s2 : 'transparent',
                border: `1px solid ${userMenu ? T.b2 : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              {/* Avatar circle */}
              <div
                className="flex items-center justify-center rounded-full text-[12px] font-bold flex-shrink-0"
                style={{
                  width: 32, height: 32,
                  background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`,
                  color: '#fff',
                }}
              >
                {(user?.full_name || user?.email || '?')[0].toUpperCase()}
              </div>
              {/* Name + role (desktop) */}
              <div className="text-left hidden sm:block">
                <div className="text-[12px] font-semibold leading-tight" style={{ color: T.tx }}>
                  {user?.full_name || user?.email}
                </div>
                <div className="text-[10px] leading-tight" style={{ color: T.tx3 }}>
                  {user?.role.replace(/_/g, ' ')}
                </div>
              </div>
              {/* Chevron */}
              <span
                className="text-[10px] hidden sm:block transition-transform"
                style={{ color: T.tx3, transform: userMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >▾</span>
            </button>

            {/* Dropdown menu */}
            {userMenu && (
              <div
                className="absolute top-full right-0 mt-1.5 rounded-xl border overflow-hidden"
                style={{
                  background: T.s1,
                  borderColor: T.b2,
                  minWidth: 220,
                  boxShadow: '0 12px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03)',
                  animation: 'fadeSlideDown .15s ease-out',
                  zIndex: 100,
                }}
              >
                <style>{`
                  @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
                `}</style>

                {/* User info header */}
                <div className="px-4 py-3 border-b" style={{ borderColor: T.b1 }}>
                  <div className="text-[12px] font-semibold" style={{ color: T.tx }}>
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: T.tx3 }}>
                    {user?.email}
                  </div>
                  {user?.tenant_key && (
                    <div
                      className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
                      style={{ background: `${BRAND.teal}15`, color: BRAND.teal, border: `1px solid ${BRAND.teal}25` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.teal }} />
                      {user.tenant_key}
                    </div>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {/* Dashboard */}
                  <button
                    onClick={() => { setUserMenu(false); router.push('/dashboard') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ color: T.tx2, background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.tx }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.tx2 }}
                  >
                    <span className="text-[13px] w-5 text-center">📊</span>
                    <span className="text-[12px] font-medium">Dashboard</span>
                  </button>

                  {/* Account */}
                  <button
                    onClick={() => { setUserMenu(false); if (onAccount) onAccount(); else router.push('/account') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ color: T.tx2, background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.tx }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.tx2 }}
                  >
                    <span className="text-[13px] w-5 text-center">👤</span>
                    <span className="text-[12px] font-medium">Account</span>
                  </button>

                  {/* Settings & Team — only for admin roles */}
                  {user?.role && (user.role === 'tenant_admin' || user.role === 'super_admin' || user.role === 'customer_admin') && (
                    <button
                      onClick={() => { setUserMenu(false); if (onSettings) onSettings(); else router.push('/settings/team') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{ color: T.tx2, background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.tx }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.tx2 }}
                    >
                      <span className="text-[13px] w-5 text-center">⚙️</span>
                      <div>
                        <span className="text-[12px] font-medium">Settings & Team</span>
                        <div className="text-[9px] mt-0.5" style={{ color: T.tx3 }}>Invite members, manage roles</div>
                      </div>
                    </button>
                  )}

                  {/* Migrate Your IVR */}
                  <button
                    onClick={() => { setUserMenu(false); const el = document.getElementById('integrations'); if (el) { let sp: HTMLElement | null = el.parentElement; while (sp) { const ov = window.getComputedStyle(sp).overflowY; if (ov === 'auto' || ov === 'scroll') break; sp = sp.parentElement } if (sp) { let off = 0; let nd: HTMLElement | null = el; while (nd && nd !== sp) { off += nd.offsetTop; nd = nd.offsetParent as HTMLElement }; sp.scrollTo({ top: Math.max(0, off - 60), behavior: 'smooth' }) } else { el.scrollIntoView({ behavior: 'smooth' }) } } }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ color: T.tx2, background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.tx }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.tx2 }}
                  >
                    <span className="text-[13px] w-5 text-center">🔌</span>
                    <span className="text-[12px] font-medium">Ecosystem</span>
                  </button>
                  <button
                    onClick={() => { setUserMenu(false); router.push('/migrate') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ color: T.tx2, background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.tx }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.tx2 }}
                  >
                    <span className="text-[13px] w-5 text-center">🔄</span>
                    <span className="text-[12px] font-medium">Migrate Your IVR</span>
                  </button>
                </div>

                {/* Sign out — separated */}
                <div className="border-t py-1" style={{ borderColor: T.b1 }}>
                  <button
                    onClick={() => { setUserMenu(false); onSignOut?.() }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ color: '#f87171', background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="text-[13px] w-5 text-center">🚪</span>
                    <span className="text-[12px] font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auth — logged out */}
        {!isLoggedIn && (
          <React.Fragment>
            <button
              onClick={onSignIn}
              className="hidden sm:block px-4 py-1.5 text-[12px] font-semibold rounded border"
              style={{ borderColor: T.b2, color: T.tx, background: 'transparent' }}
            >
              Log In
            </button>
            {(isHomepage || isJourney) && (
              <button
                onClick={onGetStarted}
                className="px-3 sm:px-4 py-1.5 text-[11px] sm:text-[12px] font-semibold rounded"
                style={{ background: BRAND.blue, color: '#fff' }}
              >
                {isJourney ? 'Try Live →' : 'Get Started'}
              </button>
            )}
            {variant === 'session' && (
              <button
                onClick={onSignIn}
                className="px-4 py-1.5 text-[11px] font-semibold rounded cursor-pointer"
                style={{ background: BRAND.teal, color: '#000' }}
              >
                Sign Up Free
              </button>
            )}
          </React.Fragment>
        )}
      </div>
    </nav>
  )
}
