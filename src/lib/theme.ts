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
  // ── B4 STEP 2 (values exactly as the pages use them today) ──
  strong: '#fff',               // high-emphasis text on dark surfaces (headings, KPI values)
  shade: '#000',                // black shadows / dimming layers
  onColor: '#000',              // text on an accent-coloured fill (dynamic colours); light: white
  veil: '#FFFFFF',              // white washes on dark: rgba(255,255,255,.03–.1) → tint('veil', …)
  ok: '#22C55E', warn: '#F59E0B', cyan: '#06B6D4', mint: '#6EE7B7', emerald: '#50C878', indigo: '#6366F1', azure: '#3B82F6',
  silver: '#C0C0C0', bronze: '#CD7F32', sky: '#80AAF4', alarm: '#D44444', muted: '#6B7280', steel: '#6090B0',
  gold: '#FBBF24', jade: '#34D399', jadeB: '#22D399', violet: '#A78BFA', crimson: '#DC2626', pink: '#EC4899',
  onGreen: '#050E1A',                                         // text on a green fill
  promoA: '#0F2050', promoB: '#0C3040',                       // GRADIENTS.promo stops (FREE banner on /experience)
  // IVR keypad (green "device" panel on the call screen)
  padBg: '#0A1A0F', padKey: '#0F2518', padKeyHi: '#1A2E1F', padEdge: '#1E3A2A', padSub: '#064E3B',
  padText: '#E0E4EC', padDim: '#4B5563', padLit: '#4ADE80',
  onAmber: '#080D18',                                         // text on an amber fill
  scrim: 'rgba(5,10,18,.82)', panel: 'rgba(11,19,32,.97)',    // modal backdrop / floating panel
  // older palette in globals.css (:root --bg/--card/…), also written inline on /experience and the demo panels
  xBg: '#070D1A', xSurf: '#0B1320', xCard: '#0F1824', xCard2: '#121E2D', xB1: '#1A2B40', xB2: '#1F3350',
  xDim: '#3D5570', xText: '#A8C0E0', xBright: '#D8ECFF', xGreen: '#18C48A', xAmber: '#E09820', xPurple: '#8A4EE8',
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
// Every alpha the pages use (hex suffix → #RRGGBBhh, decimal → rgba()). A test checks every tint()/alpha() call
// in src uses one of these. Every hex colour token gets every alpha, so nothing can be "unregistered" at runtime.
export const ALPHAS = [
  '04', '08', '10', '11', '12', '15', '18', '1F', '20', '22', '25', '30', '33', '40', '44', '50', '66', '80', '88',
  '.02', '.03', '.04', '.05', '.06', '.07', '.08', '.1', '.12', '.15', '.18', '.2', '.25', '.3', '.4', '.5', '.6', '.8', '.96',
] as const
/** Tokens whose value is a hex colour (the rgba tokens — teal2, overlay, headerBg … — are not tinted). */
export const COLOR_TOKENS = (Object.keys(DARK) as Token[]).filter(t => /^#[0-9a-fA-F]{3,6}$/.test(DARK[t]))
export const TINTS: ReadonlyArray<readonly [Token, string]> = COLOR_TOKENS.flatMap(t => ALPHAS.map(a => [t, a] as const))
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
  return `${cssName(token)}-a${alpha.replace('.', 'd').toLowerCase()}`
}
export function tint(token: Token, alpha: string): string {
  if (!TINT_SET.has(`${token}:${alpha}`)) throw new Error(`tint(${token}, ${alpha}) is not registered in theme.ts TINTS`)
  return `var(${tintName(token, alpha)}, ${tintValue(DARK[token], alpha)})`
}

const TOKEN_BY_VAR = new Map((Object.keys(DARK) as Token[]).map(t => [cssName(t), t]))
const VAR_REF = /^var\((--brand-[a-z0-9-]+), [^)]*\)$/
/**
 * Alpha variant of a colour held in a variable/map (replaces `${color}22` / color + '40'): a T value maps back to
 * its token → tint(token, alpha). A raw hex keeps the legacy string (old behaviour, unthemed).
 */
export function alpha(color: string, a: string): string {
  const tok = TOKEN_BY_VAR.get(VAR_REF.exec(color)?.[1] || '')
  if (tok && TINT_SET.has(`${tok}:${a}`)) return tint(tok, a)
  return /^#[0-9a-fA-F]{6}$/.test(color) ? tintValue(color, a) : color
}

// ── Themed tokens for styling (CSS variable references) ───────────
export const BRAND = {
  blue: v('blue'), teal: v('teal'), amber: v('amber'), red: v('red'), green: v('green'), purple: v('purple'),
  cyan: BRAND_HEX.cyan,
} as const

/** Every token as var(--brand-<token>, <AiIVRs dark value>). */
export const T = Object.fromEntries((Object.keys(DARK) as Token[]).map(k => [k, v(k)])) as { readonly [K in Token]: string }

/**
 * The dashboard / Telephony local palette (R90: merged here). Identical to T except blue = #3D85E0 (blueAlt)
 * and tx3 = #364D6A (tx3Dim) — kept so AiIVRs stays pixel-identical.
 */
export const T_DASH = { ...T, blue: T.blueAlt, tx3: T.tx3Dim } as const
/** Token names behind T_DASH.blue / T_DASH.tx3 (for tint()). */
export const DASH_TOKEN = { blue: 'blueAlt', tx3: 'tx3Dim' } as const
/** The session-dashboard local palette (R90: merged here): T with blue = #3D85E0 (blueAlt). */
export const T_SESSION = { ...T, blue: T.blueAlt } as const

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
