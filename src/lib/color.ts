// Colour helpers for tenant branding on the dark app theme. Pure functions, no DOM.
// The WCAG 2.x contrast maths is identical to public/partners/template.js (same luminance
// formula and 0.03928 threshold); scripts/test_color.mjs checks both give the same numbers.
import { SURFACES } from './theme'

export const HEX_RE = /^#[0-9a-fA-F]{6}$/
export const MIN_TEXT_CONTRAST = 4.5
export const NEAR_BLACK = '#0B0F14'
export const WHITE = '#FFFFFF'

export function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v)
}

export function luminance(hex: string): number {
  const ch = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5)
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Text colour for a button filled with `bg`: white or near-black, whichever contrasts more. */
export function buttonTextColor(bg: string): string {
  return contrastRatio(bg, WHITE) >= contrastRatio(bg, NEAR_BLACK) ? WHITE : NEAR_BLACK
}

/** Mix `hex` toward white by t (0–1). */
export function lighten(hex: string, t: number): string {
  const k = Math.min(1, Math.max(0, t))
  const out = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16)
    return Math.round(c + (255 - c) * k).toString(16).padStart(2, '0')
  })
  return ('#' + out.join('')).toUpperCase()
}

/**
 * Accent used as TEXT on a dark surface: the accent itself when it already reaches `min`,
 * otherwise lightened in 5% steps until it does (white at the latest).
 */
export function readableAccent(accent: string, surface: string = SURFACES.bg, min: number = MIN_TEXT_CONTRAST): string {
  if (!isHex(accent)) return WHITE
  for (let step = 0; step <= 20; step++) {
    const c = step === 0 ? accent.toUpperCase() : lighten(accent, step * 0.05)
    if (contrastRatio(c, surface) >= min) return c
  }
  return WHITE
}
