'use client'
// Tenant branding for logged-in pages. Loads /branding/me once per login (src/lib/branding.ts),
// resolves the display name, accent colours and logo, and resets on logout / 401 / new login
// (AUTH_CLEARED_EVENT from auth.ts). Logged out → AiIVRs defaults from theme.ts.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AUTH_CLEARED_EVENT, getUser, isLoggedIn, type CxUser } from '@/lib/auth'
import { displayNameFor, fetchLogoBlobUrl, forgetBranding, loadBranding, wantsPlate, type Branding } from '@/lib/branding'
import { buttonTextColor, readableAccent } from '@/lib/color'
import { usePartnerConfig } from '@/lib/partner'
import { BRAND } from '@/lib/theme'

export interface BrandingState {
  ready: boolean
  branded: boolean            // the tenant has any branding configured
  partnerName: string | null  // set only for partner tenants ("Powered by AiIVRs")
  displayName: string | null  // never the raw tenant key
  accent: string              // fill colour (buttons, avatar)
  accentText: string          // accent as text on the dark theme (>= 4.5:1)
  onAccent: string            // text colour on an accent fill
  logoSrc: string | null      // blob: URL of the tenant logo
  logoPlate: boolean          // draw a light plate behind the logo
  reload: () => void          // re-fetch /branding/me (after Settings → Branding saves)
}

const DEFAULTS: BrandingState = {
  ready: false, branded: false, partnerName: null, displayName: null, reload: () => {},
  accent: BRAND.teal, accentText: BRAND.teal, onAccent: buttonTextColor(BRAND.teal),
  logoSrc: null, logoPlate: false,
}

const Ctx = createContext<BrandingState>(DEFAULTS)

export function useBranding(): BrandingState {
  return useContext(Ctx)
}

function stateFrom(user: CxUser | null, b: Branding, partner: ReturnType<typeof usePartnerConfig>, logoSrc: string | null): BrandingState {
  const accent = b.colors?.accent || BRAND.teal
  return {
    ready: true,
    reload: () => {},
    branded: Object.keys(b).filter(k => k !== 'partner_name').length > 0,
    partnerName: b.partner_name || null,
    displayName: displayNameFor(user, b, partner),
    accent,
    accentText: b.colors?.accent ? readableAccent(accent) : BRAND.teal,
    onAccent: buttonTextColor(accent),
    logoSrc,
    logoPlate: !!logoSrc && wantsPlate(b.logo_plate),
  }
}

export default function BrandingProvider({ children }: { children: React.ReactNode }) {
  const partner = usePartnerConfig()
  const [state, setState] = useState<BrandingState>(DEFAULTS)
  const blobRef = useRef<string | null>(null)
  const runRef = useRef(0)

  const revoke = useCallback(() => {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null }
  }, [])

  const load = useCallback(async () => {
    const run = ++runRef.current
    revoke()
    if (!isLoggedIn()) { setState({ ...DEFAULTS, ready: true }); return }
    const user = getUser()
    if (!user) { setState({ ...DEFAULTS, ready: true }); return }
    setState(stateFrom(user, {}, partner, null))          // name from company_name / partner while loading
    const b = await loadBranding(user)
    if (run !== runRef.current) return
    let logo: string | null = null
    if (b.logo_url) {
      logo = await fetchLogoBlobUrl(b.logo_url)
      if (run !== runRef.current) { if (logo) URL.revokeObjectURL(logo); return }
      blobRef.current = logo
    }
    setState(stateFrom(user, b, partner, logo))
  }, [partner, revoke])

  const reload = useCallback(() => {
    const user = getUser()
    if (user) forgetBranding(user)
    void load()
  }, [load])

  useEffect(() => {
    void Promise.resolve().then(load)  // after the effect, not synchronously inside it
    const onCleared = () => { runRef.current++; revoke(); setState({ ...DEFAULTS, ready: true }) }
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared)
    return () => { window.removeEventListener(AUTH_CLEARED_EVENT, onCleared); revoke() }
  }, [load, revoke])

  return <Ctx.Provider value={{ ...state, reload }}>{children}</Ctx.Provider>
}
