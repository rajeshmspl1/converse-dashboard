// Tenant branding for logged-in pages (B2). GET /branding/me once per login, through the shared
// fetchB (token refresh; R172 — no second auth client). Cached in sessionStorage under a key that
// contains the user id AND tenant_key; auth.ts clears it on every login, logout and 401 (R174).
// Every value from the API is validated here; nothing is rendered as HTML.
import { BRANDING_CACHE_PREFIX, authFetch, fetchB, type CxUser } from './auth'
import { getEnv } from './env'
import { isHex } from './color'
import type { PartnerAppConfig } from './partner'

export type LogoPlate = 'auto' | 'light' | 'none'

export interface Branding {
  display_name?: string
  colors?: { primary?: string; accent?: string; dark?: string; teal?: string }
  logo_url?: string
  logo_plate?: LogoPlate
  partner_name?: string   // top-level in /branding/me; set only for partner tenants
  fonts?: { heading?: string; body?: string }
  theme?: 'dark' | 'light'          // B4 (0004): logged-in theme; absent = AiIVRs dark
  show_name?: boolean               // B4 (0004): show the display name next to the logo
  favicon_url?: string
}

const ASSET_RE = /^\/branding\/asset\/(partner|tenant)\/[a-z0-9_]{1,64}\/logo\/[0-9a-f]{64}$/
const FAVICON_RE = /^\/branding\/asset\/(partner|tenant)\/[a-z0-9_]{1,64}\/favicon\/[0-9a-f]{64}$/
const FONT_NAMES = ['Open Sans', 'Poppins', 'Inter', 'Roboto', 'Lato', 'Montserrat', 'Nunito', 'Source Sans 3']
const PLATES: LogoPlate[] = ['auto', 'light', 'none']
export const LOGO_TYPES = ['image/png', 'image/jpeg']

/** Keep only well-formed fields from a /branding/me `branding` object. */
export function sanitizeBranding(raw: unknown): Branding {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: Branding = {}
  if (typeof b.display_name === 'string' && b.display_name.trim() && b.display_name.length <= 60) out.display_name = b.display_name.trim()
  const c = (b.colors && typeof b.colors === 'object' ? b.colors : {}) as Record<string, unknown>
  const colors: Branding['colors'] = {}
  for (const k of ['primary', 'accent', 'dark', 'teal'] as const) if (isHex(c[k])) colors[k] = (c[k] as string).toUpperCase()
  if (Object.keys(colors).length) out.colors = colors
  if (typeof b.logo_url === 'string' && ASSET_RE.test(b.logo_url)) out.logo_url = b.logo_url
  if (typeof b.logo_plate === 'string' && (PLATES as string[]).includes(b.logo_plate)) out.logo_plate = b.logo_plate as LogoPlate
  if (b.theme === 'dark' || b.theme === 'light') out.theme = b.theme
  if (typeof b.show_name === 'boolean') out.show_name = b.show_name
  if (typeof b.favicon_url === 'string' && FAVICON_RE.test(b.favicon_url)) out.favicon_url = b.favicon_url
  const f = (b.fonts && typeof b.fonts === 'object' ? b.fonts : {}) as Record<string, unknown>
  const fonts: Branding['fonts'] = {}
  for (const k of ['heading', 'body'] as const) if (typeof f[k] === 'string' && FONT_NAMES.includes(f[k] as string)) fonts[k] = f[k] as string
  if (Object.keys(fonts).length) out.fonts = fonts
  if (typeof b.partner_name === 'string' && b.partner_name.trim() && b.partner_name.length <= 60) out.partner_name = b.partner_name.trim()
  return out
}

export function cacheKey(user: Pick<CxUser, 'id' | 'tenant_key'>): string {
  return `${BRANDING_CACHE_PREFIX}:${user.id}:${user.tenant_key || '-'}`
}

function readCache(user: CxUser): Branding | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(user))
    if (!raw) return null
    const v = JSON.parse(raw)
    if (v?.uid !== user.id || v?.tenant !== (user.tenant_key || '')) return null
    return sanitizeBranding(v.branding)
  } catch { return null }
}

function writeCache(user: CxUser, branding: Branding): void {
  try { sessionStorage.setItem(cacheKey(user), JSON.stringify({ uid: user.id, tenant: user.tenant_key || '', branding })) } catch { /* ignore */ }
}

/** Branding for this user: cache first, else one GET /branding/me. Empty object when none / on error. */
export async function loadBranding(user: CxUser): Promise<Branding> {
  const cached = readCache(user)
  if (cached) return cached
  try {
    const res = await fetchB('/branding/me')
    // The response must be for this user's tenant (never show another tenant's brand).
    if ((res?.tenant_key || '') !== (user.tenant_key || '')) return {}
    const b = sanitizeBranding({ ...(res?.branding || {}), partner_name: res?.partner_name })
    writeCache(user, b)
    return b
  } catch { return {} }
}

/**
 * Platform copy shown to a logged-in PARTNER tenant: "Converse" / "Converse AI" / "AiIVRs" in frontend strings
 * become the tenant's display name (plain text; the string is rendered as a text node). Anyone else — or no
 * name — gets the text unchanged. ("Powered by AiIVRs" is rendered separately and never passed through here.)
 */
export function brandCopy(text: string, partnerName: string | null | undefined, displayName: string | null | undefined): string {
  if (!partnerName || !displayName) return text
  return text.replace(/\bConverse(?: AI)?\b|\bAiIVRs\b/g, displayName)
}

/** Drop this user's cached branding (e.g. after saving it in Settings → Branding). */
export function forgetBranding(user: Pick<CxUser, 'id' | 'tenant_key'>): void {
  try { sessionStorage.removeItem(cacheKey(user)) } catch { /* ignore */ }
}

const ANY_ASSET_RE = /^\/branding\/asset\/(partner|tenant)\/[a-z0-9_]{1,64}\/(logo|favicon)\/[0-9a-f]{64}$/

/** Fetch the logo with the login token and return a blob: URL (PNG/JPEG only), or null. Caller revokes it. */
export async function fetchLogoBlobUrl(logoUrl: string): Promise<string | null> {
  if (!ASSET_RE.test(logoUrl)) return null
  return fetchAssetBlobUrl(logoUrl)
}

/** Same for any branding asset (logo or favicon) — used by Settings → Branding previews. */
export async function fetchAssetBlobUrl(assetUrl: string): Promise<string | null> {
  if (!ANY_ASSET_RE.test(assetUrl)) return null
  try {
    const res = await authFetch(getEnv().serviceB + assetUrl)
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!res.ok || !LOGO_TYPES.includes(type)) return null
    const blob = await res.blob()
    return URL.createObjectURL(new Blob([blob], { type }))
  } catch { return null }
}

/**
 * Name shown for the user's organisation, in this order: branding display_name → partner
 * demo_display_name (only for the partner's demo tenant) → company_name → null. Never the raw key.
 */
export function displayNameFor(user: Pick<CxUser, 'tenant_key' | 'company_name'> | null, branding: Branding,
                               partner: PartnerAppConfig | null): string | null {
  if (branding.display_name) return branding.display_name
  if (user && partner?.demoTenantKey && partner.demoDisplayName && user.tenant_key === partner.demoTenantKey) return partner.demoDisplayName
  const co = (user?.company_name || '').trim()
  return co || null
}

/** Whether the header should draw a light plate behind the logo (the app header is dark). */
export function wantsPlate(plate: LogoPlate | undefined): boolean {
  return plate !== 'none' // 'auto' (default) and 'light' → plate on the dark header
}
