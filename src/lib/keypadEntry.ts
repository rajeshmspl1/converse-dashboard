// KP1 (T2/T3): keypad entry display + keyboard rules. Pure, no React, no storage.
//
// service-a sends {"type":"numeric_entry", state:"open"|"len"|"cleared"|"closed", ...} while a
// numeric entry (account / card / ID / PIN) is pending. Those messages carry counts only, never
// digits. The page keeps the digits IT sent (memory only) and shows the first `len` of them,
// so it never shows a digit the server no longer holds. Digits the server holds that this page
// did not record (e.g. typed before the entry opened) are shown as dots.

export interface EntryState {
  open: boolean
  lengths: number[]   // expected lengths, e.g. [16, 19]
  masked: boolean     // 4-digit PIN: dots only
  canClear: boolean   // Clear button / Backspace allowed (never for the PIN)
  serverLen: number   // digits the server holds
  unknown: number     // leading server digits this page did not send since the entry opened
  typed: string[]     // digits this page sent since the entry opened / was cleared
}

export const CLOSED_ENTRY: EntryState = Object.freeze({
  open: false, lengths: [], masked: false, canClear: false, serverLen: 0, unknown: 0, typed: [],
}) as EntryState

const MAX_TYPED = 32
const DIGIT = /^[0-9]$/

const toLen = (v: unknown): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0
  return n > 0 ? Math.min(n, 64) : 0
}

/** Apply one numeric_entry message from service-a. Unknown states leave the entry unchanged. */
export function applyServerMessage(st: EntryState, msg: Record<string, unknown>): EntryState {
  switch (msg.state) {
    case 'open': {
      const masked = msg.masked === true
      const lengths = Array.isArray(msg.lengths) ? msg.lengths.map(toLen).filter(n => n > 0) : []
      const len = toLen(msg.len)
      return { open: true, lengths, masked, canClear: msg.clear === true && !masked,
               serverLen: len, unknown: len, typed: [] }
    }
    case 'len': {
      if (!st.open) return st
      const n = toLen(msg.len)
      // More digits on the server than this page sent → the extra ones are leading unknowns.
      const unknown = Math.min(n, Math.max(st.unknown, n - st.typed.length))
      return { ...st, serverLen: n, unknown }
    }
    case 'cleared':
      return st.open ? { ...st, serverLen: 0, unknown: 0, typed: [] } : st
    case 'closed':
      return CLOSED_ENTRY
    default:
      return st
  }
}

/** A key this page sent while the entry is open (digits only are remembered; never stored). */
export function recordPress(st: EntryState, key: string): EntryState {
  if (!st.open || !DIGIT.test(key) || st.typed.length >= MAX_TYPED) return st
  return { ...st, typed: [...st.typed, key] }
}

/** Optimistic local clear (the server confirms with cleared/clear). */
export function clearLocal(st: EntryState): EntryState {
  return st.open ? { ...st, serverLen: 0, unknown: 0, typed: [] } : st
}

/** The characters to show: dots for the PIN and for unknown leading digits, then typed digits. */
export function visibleChars(st: EntryState): string {
  if (!st.open || st.serverLen <= 0) return ''
  if (st.masked) return '•'.repeat(st.serverLen)
  const known = st.typed.slice(0, Math.max(0, st.serverLen - st.unknown)).join('')
  return '•'.repeat(Math.min(st.unknown, st.serverLen)) + known
}

/** Groups of four: "0123 4567 8901 2345". */
export function groupFour(s: string): string {
  return s.replace(/(.{4})(?=.)/gu, '$1 ')
}

export function displayText(st: EntryState): string {
  return groupFour(visibleChars(st))
}

/** "16 or 19 digits" / "13 digits" / "4-digit PIN". */
export function lengthHint(st: EntryState): string {
  if (st.masked) return `${st.lengths[0] || 4}-digit PIN`
  const l = [...new Set(st.lengths)].sort((a, b) => a - b)
  if (!l.length) return ''
  return `${l.length > 1 ? l.slice(0, -1).join(', ') + ' or ' + l[l.length - 1] : l[0]} digits`
}

/** In-page log text for a sent key: never a digit while an entry is open. */
export function logKey(st: EntryState, key: string): string {
  return st.open && DIGIT.test(key) ? '•' : key
}

/* ── Keyboard (T3) ─────────────────────────────────────────────────────────── */

export interface KeyInfo {
  key: string
  repeat: boolean
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  editable: boolean   // typed in input / textarea / select / contenteditable
}

export type KeyAction =
  | { kind: 'ignore' }              // do nothing, let the browser handle it
  | { kind: 'dtmf'; digit: string } // send exactly one key, like an on-screen press
  | { kind: 'clear' }               // Clear the entry (Backspace)
  | { kind: 'block' }               // swallow (preventDefault): never activate a focused button

const PAD_KEYS = '0123456789*#'

/** Decide what one keydown does. `ivrMode` = today's rule for the keyboard (IVR mode only). */
export function keyAction(k: KeyInfo, ivrMode: boolean, entry: EntryState): KeyAction {
  // Guards that always apply.
  if (k.metaKey || k.ctrlKey || k.altKey || k.editable) return { kind: 'ignore' }
  const isPad = k.key.length === 1 && PAD_KEYS.includes(k.key)
  if (entry.open) {
    if (k.repeat) return isPad || k.key === 'Backspace' ? { kind: 'block' } : { kind: 'ignore' }
    if (isPad) return { kind: 'dtmf', digit: k.key }
    if (k.key === 'Backspace') return entry.canClear ? { kind: 'clear' } : { kind: 'block' }
    if (k.key === ' ' || k.key === 'Spacebar' || k.key === 'Enter' || k.key === 'Tab') return { kind: 'block' }
    return { kind: 'ignore' }
  }
  if (k.repeat) return { kind: 'ignore' }
  if (ivrMode && isPad) return { kind: 'dtmf', digit: k.key }
  return { kind: 'ignore' }
}

/** True when the keydown target is a text field (keys typed there are never pad keys). */
export function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as (HTMLElement & { isContentEditable?: boolean }) | null
  if (!el || typeof el !== 'object') return false
  if (el.isContentEditable) return true
  const tag = (el.tagName || '').toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}
