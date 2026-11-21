// B4 — tenant theme as CSS variables (--brand-*). Pure; unit-tested in scripts/test_brand_theme.mjs.
// Input: the validated Branding from /branding/me (hex colours, allow-listed fonts, theme enum).
// Output: { name: value } for document.documentElement.style — every value is a #RRGGBB, an rgba() we
// computed, or an allow-listed font stack. No branding → {} (AiIVRs dark exactly as today: the CSS
// fallbacks in theme.ts apply).
import { DARK, TINTS, cssName, tintName, type Token } from './theme'
import { buttonTextColor, contrastRatio, darken, isHex, readableOn } from './color'

export const THEMES = ['dark', 'light'] as const
export type ThemeName = typeof THEMES[number]

const L_SURF = { bg: '#F4F5F7', s1: '#FFFFFF', s2: '#F8F9FB', s3: '#EEF0F3' }
export const LIGHT_SURFACES = [L_SURF.bg, L_SURF.s1, L_SURF.s2, L_SURF.s3]
export const DARK_SURFACES = [DARK.bg, DARK.s1, DARK.s2, DARK.s3]
/** Strongest same-colour tint we design text-on-tint for (badges/chips: text in colour X on a fill of X at ≤ 20%). */
export const TINT_CEILING = 0.2
function mixHex(c: string, s: string, a: number): string {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const x = p(c), y = p(s)
  return '#' + x.map((v, i) => Math.round(v * a + y[i] * (1 - a)).toString(16).padStart(2, '0')).join('').toUpperCase()
}
/**
 * A colour for the LIGHT theme: >= 4.5:1 on every light surface AND on every light surface washed with itself at
 * TINT_CEILING (so a badge "X text on X tint" stays readable). Darkens until both hold.
 */
export function lightAccent(hex: string): string {
  let c = readableOn(hex, LIGHT_SURFACES)
  for (let i = 0; i < 40; i++) {
    if (LIGHT_SURFACES.every(s => contrastRatio(c, mixHex(c, s, TINT_CEILING)) >= 4.5)) return c
    c = darken(c, 0.05)
  }
  return c
}
const onLight = lightAccent

/** Light theme (new tokens; every text/surface pair >= 4.5:1 — see the tests). */
export const LIGHT: Record<Token, string> = {
  blue: onLight('#1D4ED8'), blueAlt: onLight('#1D4ED8'), teal: onLight('#0F766E'), amber: onLight('#92400E'),
  red: onLight('#B91C1C'), green: onLight('#047857'), purple: onLight('#6D28D9'),
  tx: '#0F172A', tx2: onLight('#475569'), tx3: onLight('#56606E'), tx3Dim: onLight('#56606E'),
  ...L_SURF, b1: '#E2E5EA', b2: '#CBD2DC',
  danger: onLight('#B42318'), onTeal: '#FFFFFF', onBlue: '#FFFFFF', onDanger: '#FFFFFF', white: '#FFFFFF',
  navText: '#475569', headerBg: 'rgba(255,255,255,0.96)', overlay: 'rgba(15,23,42,.45)',
  teal2: 'rgba(15,118,110,.12)', amber2: 'rgba(146,64,14,.12)', red2: 'rgba(185,28,28,.12)',
  green2: 'rgba(4,120,87,.12)', blue2: 'rgba(29,78,216,.12)', purple2: 'rgba(109,40,217,.12)',
  // STEP 2
  strong: '#0F172A', shade: '#0F172A', veil: '#0F172A',   // washes become faint ink on light
  onColor: '#FFFFFF',                                      // every light accent is >= 4.5:1 against white
  ok: onLight(DARK.ok), warn: onLight(DARK.warn), cyan: onLight(DARK.cyan), mint: onLight(DARK.mint),
  emerald: onLight(DARK.emerald), indigo: onLight(DARK.indigo), azure: onLight(DARK.azure),
  silver: onLight(DARK.silver), bronze: onLight(DARK.bronze), sky: onLight(DARK.sky), alarm: onLight(DARK.alarm),
  muted: onLight(DARK.muted), steel: onLight(DARK.steel),
  gold: onLight(DARK.gold), jade: onLight(DARK.jade), jadeB: onLight(DARK.jadeB), violet: onLight(DARK.violet),
  crimson: onLight(DARK.crimson), pink: onLight(DARK.pink), onGreen: '#FFFFFF',
  promoA: '#EEF2FB', promoB: '#EAF4F3', onAmber: '#FFFFFF',
  padBg: '#F0FDF4', padKey: '#FFFFFF', padKeyHi: '#DCFCE7', padEdge: '#BBF7D0', padSub: '#ECFDF5',
  padText: '#0F172A', padDim: onLight('#56606E'), padLit: onLight(DARK.padLit),
  scrim: 'rgba(15,23,42,.45)', panel: 'rgba(255,255,255,.97)',
  xBg: L_SURF.bg, xSurf: L_SURF.s2, xCard: L_SURF.s1, xCard2: L_SURF.s2, xB1: '#E2E5EA', xB2: '#CBD2DC',
  xDim: onLight('#56606E'), xText: onLight('#334155'), xBright: '#0F172A',
  xGreen: onLight(DARK.xGreen), xAmber: onLight(DARK.xAmber), xPurple: onLight(DARK.xPurple),
}
export const TEXT_TOKENS: Token[] = ['tx', 'tx2', 'tx3', 'tx3Dim', 'blue', 'blueAlt', 'teal', 'amber', 'red', 'green', 'purple', 'danger',
  'strong', 'ok', 'warn', 'cyan', 'mint', 'emerald', 'indigo', 'azure', 'silver', 'bronze', 'sky', 'alarm', 'muted', 'steel', 'padText', 'padDim', 'padLit', 'gold', 'jade', 'jadeB', 'violet', 'crimson', 'pink', 'xDim', 'xText', 'xBright', 'xGreen', 'xAmber', 'xPurple']

// Allow-listed fonts (same list as service-b FONT_ALLOWLIST / brandingForm.ts).
export const FONT_STACKS: Record<string, string> = {
  'Open Sans': "'Open Sans', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  'Poppins': "'Poppins', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  'Inter': "'Inter', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  'Roboto': "'Roboto', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  'Lato': "'Lato', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  'Montserrat': "'Montserrat', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  'Nunito': "'Nunito', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  'Source Sans 3': "'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
}

export interface ThemeInput {
  theme?: string
  colors?: { primary?: string; accent?: string; dark?: string; teal?: string }
  fonts?: { heading?: string; body?: string }
}

function rgba(hex: string, a: number): string {
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16)
  return `rgba(${n(1)},${n(3)},${n(5)},${Math.round(a * 1000) / 1000})`
}
const alphaOf = (alpha: string) => (/^[0-9a-fA-F]{2}$/.test(alpha) ? parseInt(alpha, 16) / 255 : parseFloat(alpha))

export function themeOf(b: ThemeInput): ThemeName {
  return b.theme === 'light' ? 'light' : 'dark'
}

/** Is there anything to theme? (unbranded tenants keep the AiIVRs look with no variables at all) */
export function isBranded(b: ThemeInput): boolean {
  return !!(b.theme || b.colors?.primary || b.colors?.accent || b.fonts?.heading || b.fonts?.body)
}

/** CSS variables for a branded tenant. */
export function buildThemeVars(b: ThemeInput): Record<string, string> {
  if (!isBranded(b)) return {}
  const theme = themeOf(b)
  const base: Record<Token, string> = { ...(theme === 'light' ? LIGHT : DARK) } as Record<Token, string>
  const surfaces = theme === 'light' ? LIGHT_SURFACES : DARK_SURFACES
  const accent = isHex(b.colors?.accent) ? b.colors!.accent! : null
  const primary = isHex(b.colors?.primary) ? b.colors!.primary! : null
  // Brand colours replace the AiIVRs interactive colours, adjusted to stay readable on this theme.
  const fit = (hex: string) => (theme === 'light' ? lightAccent(hex) : readableOn(hex, surfaces))
  if (accent) base.teal = fit(accent)
  if (primary) { base.blue = fit(primary); base.blueAlt = base.blue }
  if (theme === 'light' || accent) base.onTeal = isHex(base.teal) ? buttonTextColor(base.teal) : base.onTeal
  if (theme === 'light' || primary) base.onBlue = isHex(base.blue) ? buttonTextColor(base.blue) : base.onBlue
  for (const k of ['teal', 'blue'] as const) if (isHex(base[k])) base[`${k}2` as Token] = rgba(base[k], 0.12)
  const out: Record<string, string> = {}
  const changed = (t: Token) => theme === 'light' || base[t] !== DARK[t]
  for (const t of Object.keys(base) as Token[]) if (changed(t)) out[cssName(t)] = base[t]
  for (const [t, alpha] of TINTS) {
    if (!changed(t)) continue
    const hex = isHex(base[t]) ? base[t] : null
    if (hex) out[tintName(t, alpha)] = rgba(hex, alphaOf(alpha))
  }
  const body = b.fonts?.body && FONT_STACKS[b.fonts.body]
  const heading = b.fonts?.heading && FONT_STACKS[b.fonts.heading]
  if (body) out['--brand-font-body'] = body
  if (heading) out['--brand-font-heading'] = heading
  return out
}

/** Google Fonts URL for the allow-listed brand fonts (same form as the partner page), or null. */
export function brandFontsUrl(b: ThemeInput): string | null {
  const fams = [...new Set([b.fonts?.heading, b.fonts?.body].filter((f): f is string => !!f && f in FONT_STACKS))]
  if (!fams.length) return null
  return 'https://fonts.googleapis.com/css2?' + fams.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`).join('&') + '&display=swap'
}

// ── validation shared with the pre-paint script in layout.tsx ──
export const VAR_NAME_RE = /^--brand-[a-z0-9-]{1,40}$/
export const VAR_VALUE_RE = /^(#[0-9A-Fa-f]{3,8}|rgba\(\d{1,3},\d{1,3},\d{1,3},(?:0|1|0?\.\d{1,4})\))$/
export function safeVars(vars: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!vars || typeof vars !== 'object') return out
  const fonts = new Set(Object.values(FONT_STACKS))
  for (const [k, val] of Object.entries(vars as Record<string, unknown>)) {
    if (typeof val !== 'string' || !VAR_NAME_RE.test(k)) continue
    if (VAR_VALUE_RE.test(val) || fonts.has(val)) out[k] = val
  }
  return out
}

// ── theme cache (sessionStorage, per user + tenant; cleared with the branding cache — R174) ──
export const THEME_CACHE_PREFIX = 'cx_branding_theme' // starts with BRANDING_CACHE_PREFIX → cleared by clearBrandingCache
export interface ThemeCache { uid: number; tenant: string; theme: ThemeName; vars: Record<string, string>; title: string | null }
export function themeCacheKey(uid: number | string, tenant: string | null | undefined): string {
  return `${THEME_CACHE_PREFIX}:${uid}:${tenant || '-'}`
}

/**
 * Runs in <head> before first paint (layout.tsx). Reads ONLY this user's cached theme, validates every
 * variable name/value (#hex, rgba() we computed, allow-listed font stacks) and the title (plain text),
 * then applies them. Logged in without a cache → hide the page until BrandingProvider resolves (max 1.5 s).
 * Logged out → does nothing (public pages untouched).
 */
export const PREPAINT_SCRIPT = `(function(){try{
var d=document.documentElement,u=JSON.parse(localStorage.getItem('cx_user')||'null');
if(!u||!localStorage.getItem('cx_access_token')||typeof u.id!=='number')return;
var raw=sessionStorage.getItem(${JSON.stringify(THEME_CACHE_PREFIX + ':')}+u.id+':'+(u.tenant_key||'-'));
if(!raw){d.classList.add('brand-pending');setTimeout(function(){d.classList.remove('brand-pending')},1500);return}
var c=JSON.parse(raw);if(!c||c.uid!==u.id||!c.vars)return;
var N=${VAR_NAME_RE.toString()},V=${VAR_VALUE_RE.toString()},F=${JSON.stringify(Object.values(FONT_STACKS))};
for(var n in c.vars){var v=c.vars[n];if(typeof v==='string'&&N.test(n)&&(V.test(v)||F.indexOf(v)>=0))d.style.setProperty(n,v)}
if(c.theme==='light')d.setAttribute('data-theme','light');
if(typeof c.title==='string'&&c.title.length>0&&c.title.length<=60&&!/[<>]/.test(c.title))document.title=c.title;
}catch(e){}})();`

/** Worst contrast of the theme's text tokens on its surfaces (used by tests and the Settings preview). */
export function worstTextContrast(vars: Record<string, string>, theme: ThemeName): number {
  const base = theme === 'light' ? LIGHT : DARK
  const val = (t: Token) => vars[cssName(t)] || base[t]
  const surfaces = (['bg', 's1', 's2', 's3'] as Token[]).map(val)
  return Math.min(...TEXT_TOKENS.flatMap(t => surfaces.map(s => contrastRatio(val(t), s))))
}
