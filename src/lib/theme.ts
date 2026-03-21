// ═══════════════════════════════════════════════════════════════════
// Converse AI — Brand Design Tokens (Single Source of Truth)
// Version 1.0 — March 2026
// Import: import { T, BRAND, FONTS, GRADIENTS, HEADER, RADIUS } from '@/lib/theme'
// ═══════════════════════════════════════════════════════════════════

// ── Primary Palette ──────────────────────────────────────────────
export const BRAND = {
  blue:   '#3370E8',  // Primary — CTAs, links, active states, logo
  teal:   '#00C9B1',  // Success — active tabs, resolution, positive KPIs
  amber:  '#F5A623',  // Warning — CSAT, demo badges, FREE tags
  red:    '#F03060',  // Error ONLY — live indicators, abandonment
  green:  '#00DE7A',  // Money — billing, resolved, cost savings
  purple: '#8B5CF6',  // Premium — upgrade nudges, max 1 per screen
  cyan:   '#0EA8B8',  // Gradient end only — never standalone
} as const

// ── Backgrounds & Surfaces (Dark Theme ONLY) ────────────────────
export const SURFACES = {
  bg:  '#080D18',   // Deepest page background
  s1:  '#0D1526',   // Cards, nav bars, panels
  s2:  '#111D30',   // Sub-nav, inputs, hover states
  s3:  '#16243A',   // Elevated hover, active inputs
  b1:  '#1C2D45',   // Primary borders
  b2:  '#243558',   // Secondary borders, inactive buttons
} as const

// ── Text Hierarchy ───────────────────────────────────────────────
export const TEXT = {
  primary:   '#DDE6F5',  // Headlines, body, KPI values
  secondary: '#7A90B5',  // Descriptions, labels, inactive tabs
  tertiary:  '#4A5F80',  // Hints, timestamps, disabled text
} as const

// ── Combined T object (drop-in replacement for local T = {...}) ──
export const T = {
  // Brand colors
  blue: BRAND.blue, teal: BRAND.teal, amber: BRAND.amber,
  red: BRAND.red, green: BRAND.green, purple: BRAND.purple,

  // Alpha variants (tags, badges, highlights)
  teal2:   'rgba(0,201,177,.12)',
  amber2:  'rgba(245,166,35,.12)',
  red2:    'rgba(240,48,96,.12)',
  green2:  'rgba(0,222,122,.12)',
  blue2:   'rgba(61,133,224,.12)',
  purple2: 'rgba(139,92,246,.12)',

  // Text
  tx:  TEXT.primary,
  tx2: TEXT.secondary,
  tx3: TEXT.tertiary,

  // Surfaces
  bg: SURFACES.bg, s1: SURFACES.s1, s2: SURFACES.s2, s3: SURFACES.s3,
  b1: SURFACES.b1, b2: SURFACES.b2,
} as const

// ── Typography ───────────────────────────────────────────────────
export const FONTS = {
  ui:   'Inter, system-ui, -apple-system, sans-serif',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const

// ── Approved Gradients (only 2 allowed) ──────────────────────────
export const GRADIENTS = {
  logo:  'linear-gradient(135deg, #3370E8, #0EA8B8)',
  promo: 'linear-gradient(90deg, #0F2050, #0C3040)',
} as const

// ── Header Spec ──────────────────────────────────────────────────
export const HEADER = {
  height:  44,           // px — h-11 in tailwind
  bg:      'rgba(7,13,26,0.96)',
  blur:    'blur(12px)',
  logoSize: 22,          // px — w-[22px] h-[22px]
  logoRadius: 7,         // px — rounded-[7px]
  zIndex:  50,
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
    --blue: ${BRAND.blue};
    --teal: ${BRAND.teal};
    --amber: ${BRAND.amber};
    --red: ${BRAND.red};
    --green: ${BRAND.green};
    --purple: ${BRAND.purple};
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
