// Settings → Branding form logic (pure; unit-tested in scripts/test_branding_form.mjs).
// The same rules as service-b branding_validation.py (B1/B2), using color.ts for contrast, so a value
// the page accepts is a value the API accepts. Saving goes through the existing B1 endpoints only.
import { contrastRatio, isHex } from './color'
import { isAdminRole } from './roles'

export const FONT_ALLOWLIST = ['Open Sans', 'Poppins', 'Inter', 'Roboto', 'Lato', 'Montserrat', 'Nunito', 'Source Sans 3'] as const
export const LOGO_PLATES = ['auto', 'light', 'none'] as const
export type LogoPlate = typeof LOGO_PLATES[number]
export const DISPLAY_NAME_MAX = 60
// Upload limits (B1 IMAGE_RULES) shown next to the upload buttons.
export const IMAGE_LIMITS = {
  logo: { maxBytes: 256 * 1024, minW: 32, maxW: 2000, minH: 16, maxH: 800, square: false },
  favicon: { maxBytes: 64 * 1024, minW: 16, maxW: 512, minH: 16, maxH: 512, square: true },
} as const
export const UPLOAD_TYPES = ['image/png', 'image/jpeg']

const WHITE = '#FFFFFF'
const DARK_SURFACE = '#080D18' // B1 REFERENCE_DARK_SURFACE (= theme.ts SURFACES.bg)

export type ColorKey = 'primary' | 'accent' | 'dark'
export type Field = 'display_name' | ColorKey | 'gradient' | 'heading' | 'body' | 'logo_plate'
export const FIELDS: Field[] = ['display_name', 'primary', 'accent', 'dark', 'gradient', 'heading', 'body', 'logo_plate']

export interface Values {
  display_name: string
  primary: string
  accent: string
  dark: string
  gradient_from: string
  gradient_to: string
  heading: string
  body: string
  logo_plate: LogoPlate
}
export interface FormState extends Values {
  override: Record<Field, boolean> // tenant scope: on = tenant value set, off = cleared (inherit)
}

export const EMPTY: Values = { display_name: '', primary: '', accent: '', dark: '', gradient_from: '', gradient_to: '', heading: '', body: '', logo_plate: 'auto' }

/** Who may open Settings → Branding (testers/viewers keep the existing redirect). */
export function canEditBranding(role: string | null | undefined): boolean {
  return isAdminRole(role)
}

// ── rules (mirror B1) ──
export interface Check { ok: boolean; ratio?: number; min?: number; message?: string }

const RULES: Record<ColorKey | 'gradient', { against: string; min: number; usage: string }> = {
  primary: { against: WHITE, min: 4.5, usage: 'white text on this colour' },
  dark: { against: WHITE, min: 4.5, usage: 'white text on this colour' },
  accent: { against: DARK_SURFACE, min: 3, usage: 'this colour on the dark app background' },
  gradient: { against: WHITE, min: 4.5, usage: 'white text on this stop' },
}

export function checkColor(kind: ColorKey | 'gradient', value: string): Check {
  if (!value) return { ok: true }
  if (!isHex(value)) return { ok: false, message: 'Use #RRGGBB (for example #1F3A93)' }
  const r = RULES[kind], ratio = Math.round(contrastRatio(value, r.against) * 100) / 100
  return ratio >= r.min ? { ok: true, ratio, min: r.min } : { ok: false, ratio, min: r.min, message: `Too low: ${ratio}:1 for ${r.usage} (needs ${r.min}:1)` }
}

// Control, zero-width and bidi-override characters (built from escapes so the source stays plain ASCII).
const INVISIBLE = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u206f]', 'g')

export function cleanName(v: string): string {
  return v.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim()
}

/** Errors per field for the values that will be saved (overridden fields only on tenant scope). */
export function validate(form: FormState): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {}
  const on = (f: Field) => form.override[f]
  if (on('display_name')) {
    const n = cleanName(form.display_name)
    if (n.length > DISPLAY_NAME_MAX) e.display_name = `At most ${DISPLAY_NAME_MAX} characters`
    else if (/[<>]/.test(n)) e.display_name = 'Plain text only (no < or >)'
  }
  for (const k of ['primary', 'accent', 'dark'] as ColorKey[]) {
    if (!on(k)) continue
    const c = checkColor(k, form[k])
    if (!c.ok) e[k] = c.message
  }
  if (on('gradient')) {
    const f = form.gradient_from, t = form.gradient_to
    if (!!f !== !!t) e.gradient = 'Set both stops, or neither'
    else {
      const cf = checkColor('gradient', f), ct = checkColor('gradient', t)
      if (!cf.ok) e.gradient = `Top: ${cf.message}`
      else if (!ct.ok) e.gradient = `Bottom: ${ct.message}`
    }
  }
  for (const k of ['heading', 'body'] as const) {
    if (on(k) && form[k] && !(FONT_ALLOWLIST as readonly string[]).includes(form[k])) e[k] = 'Choose a font from the list'
  }
  if (on('logo_plate') && !(LOGO_PLATES as readonly string[]).includes(form.logo_plate)) e.logo_plate = 'Choose auto, light or none'
  return e
}

// ── load ──
/* eslint-disable @typescript-eslint/no-explicit-any -- admin API JSON */
export function valuesFromAdmin(row: any): Values {
  const c = row?.colors || {}, f = row?.fonts || {}, g = row?.hero_gradient || null
  return {
    display_name: row?.display_name || '',
    primary: c.primary || '', accent: c.accent || '', dark: c.dark || '',
    gradient_from: g?.from || '', gradient_to: g?.to || '',
    heading: f.heading || '', body: f.body || '',
    logo_plate: (LOGO_PLATES as readonly string[]).includes(row?.logo_plate) ? row.logo_plate : 'auto',
  }
}
/** Values shown as "Inherited from partner" (from /branding/me merged branding, or the partner admin row). */
export function valuesFromMerged(b: any): Values {
  return valuesFromAdmin({ display_name: b?.display_name, colors: b?.colors, fonts: b?.fonts, hero_gradient: b?.hero_gradient, logo_plate: b?.logo_plate })
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const isSet = (v: Values, f: Field): boolean =>
  f === 'gradient' ? !!(v.gradient_from || v.gradient_to) : f === 'logo_plate' ? v.logo_plate !== 'auto' : !!v[f]

/** Partner scope: every field is the scope's own value (override always on). Tenant scope: on = set on the tenant row. */
export function formFrom(values: Values, scopeType: 'partner' | 'tenant'): FormState {
  const override = Object.fromEntries(FIELDS.map(f => [f, scopeType === 'partner' ? true : isSet(values, f)])) as Record<Field, boolean>
  return { ...values, override }
}

// ── save ──
function effective(form: FormState, f: Field): unknown {
  if (!form.override[f]) return null
  switch (f) {
    case 'display_name': return cleanName(form.display_name) || null
    case 'gradient': return form.gradient_from && form.gradient_to ? { from: form.gradient_from.toUpperCase(), to: form.gradient_to.toUpperCase() } : null
    case 'logo_plate': return form.logo_plate === 'auto' ? null : form.logo_plate
    case 'primary': case 'accent': case 'dark': return form[f] ? form[f].toUpperCase() : null
    default: return form[f] || null
  }
}

/** Body for POST /admin/branding/{scope}/{id} with only the fields that changed (null = clear). */
export function buildPatch(original: FormState, form: FormState): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const changed = (f: Field) => JSON.stringify(effective(original, f)) !== JSON.stringify(effective(form, f))
  if (changed('display_name')) patch.display_name = effective(form, 'display_name')
  const colors: Record<string, unknown> = {}
  for (const k of ['primary', 'accent', 'dark'] as ColorKey[]) if (changed(k)) colors[k] = effective(form, k)
  if (Object.keys(colors).length) patch.colors = colors
  const fonts: Record<string, unknown> = {}
  for (const k of ['heading', 'body'] as const) if (changed(k)) fonts[k] = effective(form, k)
  if (Object.keys(fonts).length) patch.fonts = fonts
  if (changed('logo_plate')) patch.logo_plate = effective(form, 'logo_plate')
  if (changed('gradient')) patch.hero_gradient = effective(form, 'gradient')
  return patch
}

// ── import suggestions ──
export type SuggestionKey = 'logo' | 'favicon' | 'primary' | 'accent' | 'dark' | 'hero_gradient' | 'heading_font' | 'body_font'
export interface Staged { logo?: Blob; favicon?: Blob }

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- import API JSON */
export function suggestionUsable(key: SuggestionKey, s: any): boolean {
  if (!s) return false
  if (key === 'logo' || key === 'favicon') return s.status === 'ok' && typeof s.data_base64 === 'string' && s.mime === 'image/png'
  if (key === 'hero_gradient') return isHex(s.from) && isHex(s.to)
  if (key === 'heading_font' || key === 'body_font') return (FONT_ALLOWLIST as readonly string[]).includes(s.value)
  return isHex(s.value)
}

function b64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64), bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

/** "Apply to form": copies the ticked, usable suggestions into the form (nothing is saved). */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- import API JSON */
export function applySuggestions(form: FormState, suggestions: Record<string, any>, ticked: SuggestionKey[]): { form: FormState; staged: Staged } {
  const next: FormState = { ...form, override: { ...form.override } }
  const staged: Staged = {}
  const on = (f: Field) => { next.override[f] = true }
  for (const key of ticked) {
    const s = suggestions[key]
    if (!suggestionUsable(key, s)) continue
    if (key === 'primary' || key === 'accent' || key === 'dark') { next[key] = s.value.toUpperCase(); on(key) }
    else if (key === 'hero_gradient') { next.gradient_from = s.from.toUpperCase(); next.gradient_to = s.to.toUpperCase(); on('gradient') }
    else if (key === 'heading_font') { next.heading = s.value; on('heading') }
    else if (key === 'body_font') { next.body = s.value; on('body') }
    else if (key === 'logo' || key === 'favicon') staged[key] = b64ToBlob(s.data_base64, 'image/png')
  }
  return { form: next, staged }
}
