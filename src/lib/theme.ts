// ═══════════════════════════════════════════════════════════════════
// Converse AI — Brand Design Tokens (Single Source of Truth)
// Version 2.0 — B4 (R90 Phase 3): tokens are CSS variables (--brand-*) whose fallbacks are
// today's AiIVRs dark values, so with no variables set every page renders exactly as before.
// BrandingProvider (src/components/branding/BrandingProvider.tsx) sets the variables for a
// branded tenant (light theme / brand colours) from validated hex only — never raw CSS.
// Import: import { T, BRAND, FONTS, GRADIENTS, HEADER, RADIUS, tint } from '@/lib/theme'
// Raw hex (for calculations, never for styling a themed page): BRAND_HEX, SURFACES, TEXT, DARK
// ═══════════════════════════════════════════════════════════════════

// ── Raw AiIVRs palette (dark) ────────────────────────────────────
export const BRAND_HEX = {
  blue:   '#3370E8',  // Primary — CTAs, links, active states, logo
  teal:   '#00C9B1',  // Success — active tabs, resolution, positive KPIs
  amber:  '#F5A623',  // Warning — CSAT, demo badges, FREE tags
  red:    '#F03060',  // Error ONLY — live indicators, abandonment
  green:  '#00DE7A',  // Money — billing, resolved, cost savings
  purple: '#8B5CF6',  // Premium — upgrade nudges, max 1 per screen
  cyan:   '#0EA8B8',  // Gradient end only — never standalone
} as const

export const SURFACES = {
  bg:  '#080D18',   // Deepest page background
  s1:  '#0D1526',   // Cards, nav bars, panels
  s2:  '#111D30',   // Sub-nav, inputs, hover states
  s3:  '#16243A',   // Elevated hover, active inputs
  b1:  '#1C2D45',   // Primary borders
  b2:  '#243558',   // Secondary borders, inactive buttons
} as const

export const TEXT = {
  primary:     '#DDE6F5',  // Headlines, body, KPI values
  secondary:   '#7A90B5',  // Descriptions, labels, inactive tabs
  tertiary:    '#4A5F80',  // Hints, timestamps, disabled text
  tertiaryDim: '#364D6A',  // dashboard / Telephony local palettes (kept: AiIVRs stays pixel-identical)
} as const

/** Every themable token with its AiIVRs dark value (the CSS fallback). Keys are camelCase; CSS names kebab-case. */
export const DARK = {
  blue: BRAND_HEX.blue, blueAlt: '#3D85E0',   // blueAlt: dashboard / session / Telephony local palettes
  teal: BRAND_HEX.teal, amber: BRAND_HEX.amber, red: BRAND_HEX.red, green: BRAND_HEX.green, purple: BRAND_HEX.purple,
  tx: TEXT.primary, tx2: TEXT.secondary, tx3: TEXT.tertiary, tx3Dim: TEXT.tertiaryDim,
  bg: SURFACES.bg, s1: SURFACES.s1, s2: SURFACES.s2, s3: SURFACES.s3, b1: SURFACES.b1, b2: SURFACES.b2,
  danger: '#f87171',            // error text / destructive actions
  onTeal: '#000', onBlue: '#fff', onDanger: '#fff', white: '#fff',
  navText: 'rgba(255,255,255,.45)',
  headerBg: 'rgba(7,13,26,0.96)',
  overlay: 'rgba(4,8,18,.85)',
  teal2: 'rgba(0,201,177,.12)', amber2: 'rgba(245,166,35,.12)', red2: 'rgba(240,48,96,.12)',
  green2: 'rgba(0,222,122,.12)', blue2: 'rgba(61,133,224,.12)', purple2: 'rgba(139,92,246,.12)',
} as const
export type Token = keyof typeof DARK

export function cssName(token: string): string {
  return '--brand-' + token.replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/(\d+)/g, '-$1')
}
/** var(--brand-<token>, <AiIVRs dark value>) */
export function v(token: Token): string {
  return `var(${cssName(token)}, ${DARK[token]})`
}

// ── Alpha variants (replaces string-built `${colour}15` / rgba literals) ──────────
// alpha is written exactly as the old code did: 2 hex digits ('15' → #RRGGBB15) or a decimal ('.08' →
// rgba(r,g,b,.08)), so the fallback string is byte-for-byte the old colour. Every (token, alpha) used
// must be listed here: BrandingProvider sets exactly these variables for a branded theme.
export const TINTS: ReadonlyArray<readonly [Token, string]> = [
  ['teal', '08'], ['teal', '10'], ['teal', '12'], ['teal', '15'], ['teal', '20'], ['teal', '25'], ['teal', '30'], ['teal', '40'],
  ['tx3', '12'], ['tx3', '15'], ['tx3', '20'], ['tx3', '25'], ['tx3', '40'],
  ['s1', '80'],
  ['blue', '04'], ['blue', '08'], ['blue', '10'], ['blue', '12'], ['blue', '15'], ['blue', '20'], ['blue', '25'], ['blue', '30'], ['blue', '40'],
  ['tx2', '08'], ['tx2', '12'], ['tx2', '15'], ['tx2', '20'], ['tx2', '25'], ['tx2', '30'], ['tx2', '40'],
  ['amber', '08'], ['amber', '12'], ['amber', '15'], ['amber', '20'], ['amber', '25'], ['amber', '30'], ['amber', '40'],
  ['red', '08'], ['red', '12'], ['red', '15'], ['red', '20'], ['red', '25'], ['red', '30'], ['red', '40'],
  ['purple', '08'], ['purple', '12'], ['purple', '15'], ['purple', '20'], ['purple', '25'], ['purple', '30'], ['purple', '40'],
  ['danger', '.05'], ['danger', '.06'], ['danger', '.08'], ['danger', '.12'], ['danger', '.15'], ['danger', '.2'], ['danger', '.5'],
  ['green', '.08'], ['green', '.12'], ['green', '.2'],
]
const TINT_SET = new Set(TINTS.map(([t, a]) => `${t}:${a}`))

function rgbOf(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)) as [number, number, number]
}
/** The old string for (dark hex, alpha): '#RRGGBBhh' or 'rgba(r,g,b,.08)'. */
export function tintValue(hex: string, alpha: string): string {
  if (/^[0-9a-fA-F]{2}$/.test(alpha)) return `${hex}${alpha}`
  const [r, g, b] = rgbOf(hex)
  return `rgba(${r},${g},${b},${alpha})`
}
export function tintName(token: Token, alpha: string): string {
  return `${cssName(token)}-a${alpha.replace('.', 'd')}`
}
export function tint(token: Token, alpha: string): string {
  if (!TINT_SET.has(`${token}:${alpha}`)) throw new Error(`tint(${token}, ${alpha}) is not registered in theme.ts TINTS`)
  return `var(${tintName(token, alpha)}, ${tintValue(DARK[token], alpha)})`
}

// ── Themed tokens for styling (CSS variable references) ───────────
export const BRAND = {
  blue: v('blue'), teal: v('teal'), amber: v('amber'), red: v('red'), green: v('green'), purple: v('purple'),
  cyan: BRAND_HEX.cyan,
} as const

export const T = {
  blue: v('blue'), blueAlt: v('blueAlt'), teal: v('teal'), amber: v('amber'), red: v('red'), green: v('green'), purple: v('purple'),
  teal2: v('teal2'), amber2: v('amber2'), red2: v('red2'), green2: v('green2'), blue2: v('blue2'), purple2: v('purple2'),
  tx: v('tx'), tx2: v('tx2'), tx3: v('tx3'), tx3Dim: v('tx3Dim'),
  bg: v('bg'), s1: v('s1'), s2: v('s2'), s3: v('s3'), b1: v('b1'), b2: v('b2'),
  danger: v('danger'), onTeal: v('onTeal'), onBlue: v('onBlue'), onDanger: v('onDanger'), white: v('white'),
  navText: v('navText'), overlay: v('overlay'),
} as const

// ── Typography (brand fonts arrive as --brand-font-* from the allow-list) ──
const UI_STACK = "'DM Sans', 'Inter', system-ui, -apple-system, sans-serif"
export const FONTS = {
  ui:   `var(--brand-font-body, ${UI_STACK})`,
  heading: `var(--brand-font-heading, var(--brand-font-body, ${UI_STACK}))`,
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  uiStack: UI_STACK,
} as const

// ── Approved Gradients (only 2 allowed) ──────────────────────────
export const GRADIENTS = {
  logo:  'linear-gradient(135deg, #3370E8, #0EA8B8)',
  promo: 'linear-gradient(90deg, #0F2050, #0C3040)',
} as const

// ── Header Spec ──────────────────────────────────────────────────
// R176 (2b621d4): 56px header, 28px logo, one step larger header type. Sizes live here as tokens; the
// header uses only these (class strings are scanned by Tailwind: content ./src/**/*.ts).
export const HEADER = {
  height:  56,           // px — comfortable breathing room (R176)
  bg:      v('headerBg'),
  blur:    'blur(12px)',
  logoSize: 28,          // px — more visible (R176)
  logoRadius: 8,         // px — rounded-[8px] (R176)
  avatar:  32,           // px — user avatar circle (R176)
  subLabel: 11,          // px — "Zero Integration / Ecosystem" two-line label (R176)
  zIndex:  50,
} as const

/** Header type/spacing scale (R176) as Tailwind class strings. */
export const HEADER_TEXT = {
  pad:      'px-4 sm:px-6',                                  // <nav> side padding
  chip:     'text-[11px] px-2.5 py-1',                       // ← Home link, tenant / session chips
  nav:      'text-[13px] lg:text-[14px]',                    // marketing nav links, Migrate Your IVR
  tab:      'px-3.5 py-2 text-[12px]',                       // dashboard tabs
  avatar:   'text-[12px]',                                   // avatar initial
  userName: 'text-[12px]',
  userRole: 'text-[10px]',
  chevron:  'text-[10px]',
  login:    'px-4 py-1.5 text-[12px]',                       // Log In
  cta:      'px-3 sm:px-4 py-1.5 text-[11px] sm:text-[12px]', // Get Started / Try Live
  signup:   'px-4 py-1.5 text-[11px]',                       // Sign Up Free (session view)
} as const

// ── Border Radius Tokens ─────────────────────────────────────────
export const RADIUS = {
  card:   '12px',  // rounded-xl
  button: '8px',   // rounded-lg
  tag:    '6px',   // rounded-md
  pill:   '9999px', // rounded-full
} as const

// ── CSS Variable Map (for pages using var(--blue) pattern) ───────
export const CSS_VARS = `
  :root {
    --blue: ${BRAND_HEX.blue};
    --teal: ${BRAND_HEX.teal};
    --amber: ${BRAND_HEX.amber};
    --red: ${BRAND_HEX.red};
    --green: ${BRAND_HEX.green};
    --purple: ${BRAND_HEX.purple};
    --bright: ${TEXT.primary};
    --text: ${TEXT.primary};
    --dim: ${TEXT.secondary};
    --bg: ${SURFACES.bg};
    --card: ${SURFACES.s1};
    --card2: ${SURFACES.s2};
    --surf: ${SURFACES.s2};
    --b1: ${SURFACES.b1};
    --b2: ${SURFACES.b2};
  }
` as const
