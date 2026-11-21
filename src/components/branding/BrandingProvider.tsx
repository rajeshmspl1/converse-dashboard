'use client'
// Tenant branding for logged-in pages. Loads /branding/me once per login (src/lib/branding.ts),
// resolves the display name, accent colours and logo, and (B4) applies the tenant theme as --brand-*
// CSS variables + data-theme on <html> (src/lib/brandTheme.ts — validated hex / allow-listed fonts only).
// Resets on logout / 401 / new login (AUTH_CLEARED_EVENT). Logged out or unbranded → no variables at
// all, so every page renders exactly as today (AiIVRs dark: the CSS fallbacks in theme.ts).
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AUTH_CLEARED_EVENT, getUser, isLoggedIn, type CxUser } from '@/lib/auth'
import { displayNameFor, fetchAssetBlobUrl, fetchLogoBlobUrl, forgetBranding, loadBranding, wantsPlate, type Branding } from '@/lib/branding'
import { brandFontsUrl, buildThemeVars, lightAccent, themeCacheKey, themeOf, type ThemeName } from '@/lib/brandTheme'
import { buttonTextColor, readableAccent } from '@/lib/color'
import { usePartnerConfig } from '@/lib/partner'
import { BRAND_HEX } from '@/lib/theme'

export interface BrandingState {
  ready: boolean
  branded: boolean            // the tenant has any branding configured
  partnerName: string | null  // set only for partner tenants ("Powered by AiIVRs")
  displayName: string | null  // never the raw tenant key
  accent: string              // fill colour (buttons, avatar)
  accentText: string          // accent as text on the current theme (>= 4.5:1)
  onAccent: string            // text colour on an accent fill
  logoSrc: string | null      // blob: URL of the tenant logo
  logoPlate: boolean          // draw a light plate behind the logo
  theme: ThemeName            // 'dark' (AiIVRs, default) | 'light'
  showName: boolean           // show the display name next to the logo (0004 show_name)
  reload: () => void          // re-fetch /branding/me (after Settings → Branding saves)
}

const DEFAULTS: BrandingState = {
  ready: false, branded: false, partnerName: null, displayName: null, reload: () => {},
  accent: BRAND_HEX.teal, accentText: BRAND_HEX.teal, onAccent: buttonTextColor(BRAND_HEX.teal),
  logoSrc: null, logoPlate: false, theme: 'dark', showName: false,
}

const Ctx = createContext<BrandingState>(DEFAULTS)

export function useBranding(): BrandingState {
  return useContext(Ctx)
}

function stateFrom(user: CxUser | null, b: Branding, partner: ReturnType<typeof usePartnerConfig>, logoSrc: string | null): BrandingState {
  const accent = b.colors?.accent || BRAND_HEX.teal
  const theme = themeOf(b)
  return {
    ready: true,
    reload: () => {},
    branded: Object.keys(b).filter(k => k !== 'partner_name').length > 0,
    partnerName: b.partner_name || null,
    displayName: displayNameFor(user, b, partner),
    accent,
    accentText: !b.colors?.accent ? (theme === 'light' ? lightAccent(BRAND_HEX.teal) : BRAND_HEX.teal)
      : theme === 'light' ? lightAccent(accent) : readableAccent(accent),
    onAccent: buttonTextColor(accent),
    logoSrc,
    logoPlate: !!logoSrc && wantsPlate(b.logo_plate),
    theme,
    showName: b.show_name === true,
  }
}

// ── DOM side effects (html element only; values come from brandTheme.ts) ──
const FONT_LINK_ID = 'brand-fonts'
function clearThemeDom(applied: string[]) {
  const d = document.documentElement
  applied.forEach(n => d.style.removeProperty(n))
  d.removeAttribute('data-theme')
  document.getElementById(FONT_LINK_ID)?.remove()
}
function applyThemeDom(vars: Record<string, string>, theme: ThemeName, fontsUrl: string | null) {
  const d = document.documentElement
  Object.entries(vars).forEach(([n, val]) => d.style.setProperty(n, val))
  if (theme === 'light' && Object.keys(vars).length) d.setAttribute('data-theme', 'light'); else d.removeAttribute('data-theme')
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (fontsUrl) {
    if (!link) { link = document.createElement('link'); link.id = FONT_LINK_ID; link.rel = 'stylesheet'; document.head.appendChild(link) }
    if (link.href !== fontsUrl) link.href = fontsUrl
  } else link?.remove()
}
function setFavicons(href: string | null, originals: Map<HTMLLinkElement, string>) {
  document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach(l => {
    if (!originals.has(l)) originals.set(l, l.getAttribute('href') || '')
    l.setAttribute('href', href || originals.get(l) || '')
  })
}
function unhide() { document.documentElement.classList.remove('brand-pending') }

export default function BrandingProvider({ children }: { children: React.ReactNode }) {
  const partner = usePartnerConfig()
  const pathname = usePathname()
  const [state, setState] = useState<BrandingState>(DEFAULTS)
  const blobRef = useRef<string[]>([])
  const runRef = useRef(0)
  const appliedVars = useRef<string[]>([])
  const originalTitle = useRef<string | null>(null)
  const brandTitle = useRef<string | null>(null)
  const faviconOriginals = useRef(new Map<HTMLLinkElement, string>())

  const revoke = useCallback(() => {
    blobRef.current.forEach(u => URL.revokeObjectURL(u)); blobRef.current = []
  }, [])

  const resetDom = useCallback(() => {
    clearThemeDom(appliedVars.current); appliedVars.current = []
    if (brandTitle.current && originalTitle.current !== null) document.title = originalTitle.current
    brandTitle.current = null
    setFavicons(null, faviconOriginals.current)
  }, [])

  const load = useCallback(async () => {
    const run = ++runRef.current
    try {
      if (!isLoggedIn()) { resetDom(); revoke(); setState({ ...DEFAULTS, ready: true }); return }
      const user = getUser()
      if (!user) { resetDom(); revoke(); setState({ ...DEFAULTS, ready: true }); return }
      setState(s => (s.ready ? s : stateFrom(user, {}, partner, null)))   // keep the current look while (re)loading
      const b = await loadBranding(user)
      if (run !== runRef.current) return
      const next = stateFrom(user, b, partner, null)
      // theme variables (validated) → <html>; cache for the pre-paint script (per user + tenant)
      const vars = buildThemeVars(b)
      clearThemeDom(appliedVars.current.filter(n => !(n in vars)))
      applyThemeDom(vars, next.theme, brandFontsUrl(b))
      appliedVars.current = Object.keys(vars)
      if (originalTitle.current === null) originalTitle.current = document.title
      brandTitle.current = next.partnerName && next.displayName ? next.displayName : null
      if (brandTitle.current) document.title = brandTitle.current
      try {
        sessionStorage.setItem(themeCacheKey(user.id, user.tenant_key), JSON.stringify({
          uid: user.id, tenant: user.tenant_key || '', theme: next.theme, vars, title: brandTitle.current }))
      } catch { /* storage unavailable */ }
      unhide()
      // logo + (partner tenants) favicon as blob: URLs fetched with the token
      const old = blobRef.current; blobRef.current = []
      const logo = b.logo_url ? await fetchLogoBlobUrl(b.logo_url) : null
      const fav = next.partnerName && b.favicon_url ? await fetchAssetBlobUrl(b.favicon_url) : null
      if (run !== runRef.current) { [logo, fav].forEach(u => u && URL.revokeObjectURL(u)); return }
      blobRef.current = [logo, fav].filter((u): u is string => !!u)
      setFavicons(fav, faviconOriginals.current)
      setState({ ...next, logoSrc: logo, logoPlate: !!logo && wantsPlate(b.logo_plate) })
      old.forEach(u => URL.revokeObjectURL(u))
    } finally {
      if (run === runRef.current) unhide()
    }
  }, [partner, revoke, resetDom])

  const reload = useCallback(() => {
    const user = getUser()
    if (user) forgetBranding(user)
    void load()
  }, [load])

  useEffect(() => {
    void Promise.resolve().then(load)  // after the effect, not synchronously inside it
    const onCleared = () => { runRef.current++; revoke(); resetDom(); unhide(); setState({ ...DEFAULTS, ready: true }) }
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared)
    return () => { window.removeEventListener(AUTH_CLEARED_EVENT, onCleared); revoke() }
  }, [load, revoke, resetDom])

  // Next can rewrite <title> (metadata after hydration, client navigation): keep the partner title.
  useEffect(() => { if (brandTitle.current) document.title = brandTitle.current }, [pathname])
  useEffect(() => {
    if (!state.partnerName || !state.displayName) return
    const keep = () => { if (brandTitle.current && document.title !== brandTitle.current) document.title = brandTitle.current }
    const obs = new MutationObserver(keep)
    obs.observe(document.head, { subtree: true, childList: true, characterData: true })
    keep()
    return () => obs.disconnect()
  }, [state.partnerName, state.displayName])

  return <Ctx.Provider value={{ ...state, reload }}>{children}</Ctx.Provider>
}
