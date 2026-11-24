// KP1 — unit tests for src/lib/keypadEntry.ts + wiring checks in useLiveKitCall.ts / IvrDialpad.tsx.
// Run (Node 20):  node scripts/test_keypad_entry.mjs
import assert from 'node:assert/strict'
import { loadLib, read } from './lib_loader.mjs'

const { keypadEntry: K } = await loadLib(['keypadEntry'])
const { CLOSED_ENTRY, applyServerMessage: apply, recordPress, clearLocal, displayText, visibleChars,
        groupFour, lengthHint, logKey, keyAction, isEditableTarget } = K

let passed = 0
const t = (name, fn) => { fn(); passed++; console.log('PASS', name) }

const OPEN = { state: 'open', lengths: [16, 19], masked: false, clear: true, len: 0 }
const PIN = { state: 'open', lengths: [4], masked: true, clear: false, len: 0 }
const key = (k, o = {}) => ({ key: k, repeat: false, metaKey: false, ctrlKey: false, altKey: false, editable: false, ...o })
// page sends `digits`, server acknowledges each one with len
const typeAcked = (st, digits) => {
  for (const d of digits) {
    st = recordPress(st, d)
    st = apply(st, { state: 'len', len: st.serverLen + 1 })
  }
  return st
}
const SAMPLE = '9081726354'   // arbitrary keys, not a demo number

/* ── display ─────────────────────────────────────────────────────────────── */
t('closed entry shows nothing', () => {
  assert.equal(displayText(CLOSED_ENTRY), '')
  assert.equal(CLOSED_ENTRY.open, false)
})

t('groups of four', () => {
  assert.equal(groupFour('abcd'), 'abcd')
  assert.equal(groupFour('abcde'), 'abcd e')
  assert.equal(groupFour('abcdefghijklmnop'), 'abcd efgh ijkl mnop')
  assert.equal(groupFour('abcdefghijklm'), 'abcd efgh ijkl m')
})

t('open → digits appear only when the server counts them', () => {
  let st = apply(CLOSED_ENTRY, OPEN)
  assert.equal(st.open, true)
  assert.equal(st.canClear, true)
  st = recordPress(st, '9')
  assert.equal(displayText(st), '')            // sent, not yet acknowledged
  st = apply(st, { state: 'len', len: 1 })
  assert.equal(displayText(st), '9')
})

t('after 4, 8 and 16 digits', () => {
  let st = apply(CLOSED_ENTRY, OPEN)
  st = typeAcked(st, '9081')
  assert.equal(displayText(st), '9081')
  st = typeAcked(st, '7263')
  assert.equal(displayText(st), '9081 7263')
  st = typeAcked(st, '54321098')
  assert.equal(displayText(st), '9081 7263 5432 1098')
})

t('display never exceeds the server count (sync to server)', () => {
  let st = apply(CLOSED_ENTRY, OPEN)
  for (const d of SAMPLE) st = recordPress(st, d)
  st = apply(st, { state: 'len', len: 3 })
  assert.equal(visibleChars(st), SAMPLE.slice(0, 3))
})

t('server digits the page did not send show as dots, then typed digits in place', () => {
  let st = apply(CLOSED_ENTRY, { ...OPEN, len: 2 })     // e.g. realtime early digits replayed
  assert.equal(visibleChars(st), '••')
  st = typeAcked(st, '57')
  assert.equal(visibleChars(st), '••57')
  st = apply(apply(CLOSED_ENTRY, OPEN), { state: 'len', len: 3 })   // len without any page press
  assert.equal(visibleChars(st), '•••')
})

t('cleared (submit / reject / timeout / clear) empties the display but keeps it open', () => {
  for (const reason of ['submit', 'reject', 'timeout', 'clear']) {
    let st = typeAcked(apply(CLOSED_ENTRY, OPEN), '908172')
    st = apply(st, { state: 'cleared', reason })
    assert.equal(displayText(st), '', reason)
    assert.equal(st.open, true, reason)
    st = typeAcked(st, '12')
    assert.equal(displayText(st), '12', reason)      // the next entry starts clean
  }
})

t('timeout drift: 6 digits then timeout → empty; next full entry shows from the start', () => {
  let st = typeAcked(apply(CLOSED_ENTRY, OPEN), '908172')
  st = apply(st, { state: 'cleared', reason: 'timeout' })
  assert.equal(st.serverLen, 0)
  st = typeAcked(st, '9988776655443322')
  assert.equal(displayText(st), '9988 7766 5544 3322')
})

t('closed (filled / blocked / abandoned) hides the display', () => {
  for (const reason of ['filled', 'blocked', 'abandoned']) {
    const st = apply(typeAcked(apply(CLOSED_ENTRY, OPEN), '90'), { state: 'closed', reason })
    assert.deepEqual(st, CLOSED_ENTRY)
    assert.equal(displayText(st), '')
  }
})

t('local Clear empties at once; presses while closed are not remembered', () => {
  let st = clearLocal(typeAcked(apply(CLOSED_ENTRY, OPEN), '90817'))
  assert.equal(displayText(st), '')
  assert.deepEqual(st.typed, [])
  assert.deepEqual(recordPress(CLOSED_ENTRY, '5'), CLOSED_ENTRY)
  assert.deepEqual(clearLocal(CLOSED_ENTRY), CLOSED_ENTRY)
})

t('* and # are never shown as digits', () => {
  let st = apply(CLOSED_ENTRY, OPEN)
  st = recordPress(recordPress(st, '*'), '#')
  assert.deepEqual(st.typed, [])
})

t('PIN: dots only, no Clear', () => {
  let st = apply(CLOSED_ENTRY, PIN)
  assert.equal(st.masked, true)
  assert.equal(st.canClear, false)
  st = typeAcked(st, '7135')
  assert.equal(displayText(st), '••••')
  assert.equal(lengthHint(st), '4-digit PIN')
})

t('length hints', () => {
  assert.equal(lengthHint(apply(CLOSED_ENTRY, OPEN)), '16 or 19 digits')
  assert.equal(lengthHint(apply(CLOSED_ENTRY, { ...OPEN, lengths: [13] })), '13 digits')
})

t('bad messages are harmless', () => {
  const st = apply(CLOSED_ENTRY, OPEN)
  assert.equal(apply(st, { state: 'weird' }), st)
  assert.deepEqual(apply(CLOSED_ENTRY, { state: 'len', len: 5 }), CLOSED_ENTRY)
  assert.equal(apply(st, { state: 'len', len: 'x' }).serverLen, 0)
  assert.equal(apply(st, { state: 'len', len: -3 }).serverLen, 0)
})

t('log text never contains an entry digit', () => {
  const st = apply(CLOSED_ENTRY, OPEN)
  for (const d of '0123456789') assert.equal(logKey(st, d), '•')
  assert.equal(logKey(st, '*'), '*')
  assert.equal(logKey(CLOSED_ENTRY, '1'), '1')     // menu digits: unchanged
})

/* ── keyboard ────────────────────────────────────────────────────────────── */
const open = apply(CLOSED_ENTRY, OPEN)
const pin = apply(CLOSED_ENTRY, PIN)

t('no entry, IVR mode: pad keys exactly as before (menu digits, rating 1-5, * to the AI)', () => {
  for (const k of '0123456789*#') assert.deepEqual(keyAction(key(k), true, CLOSED_ENTRY), { kind: 'dtmf', digit: k })
  for (const k of ['1', '2', '3', '4', '5']) assert.deepEqual(keyAction(key(k), true, CLOSED_ENTRY), { kind: 'dtmf', digit: k })
  for (const k of [' ', 'Enter', 'Tab', 'Backspace', 'a']) assert.deepEqual(keyAction(key(k), true, CLOSED_ENTRY), { kind: 'ignore' })
})

t('no entry, AI mode: keyboard does nothing (unchanged)', () => {
  for (const k of '0123456789*#') assert.deepEqual(keyAction(key(k), false, CLOSED_ENTRY), { kind: 'ignore' })
})

t('entry open: pad keys act like on-screen presses (any mode)', () => {
  for (const k of '0123456789*#') {
    assert.deepEqual(keyAction(key(k), true, open), { kind: 'dtmf', digit: k })
    assert.deepEqual(keyAction(key(k), false, open), { kind: 'dtmf', digit: k })
  }
})

t('entry open: Backspace = Clear; PIN Backspace swallowed', () => {
  assert.deepEqual(keyAction(key('Backspace'), true, open), { kind: 'clear' })
  assert.deepEqual(keyAction(key('Backspace'), true, pin), { kind: 'block' })
})

t('entry open: Space / Enter / Tab never activate a button or send a key', () => {
  for (const k of [' ', 'Spacebar', 'Enter', 'Tab']) assert.deepEqual(keyAction(key(k), true, open), { kind: 'block' })
})

t('key repeat ignored always (held key → one press)', () => {
  assert.deepEqual(keyAction(key('7', { repeat: true }), true, CLOSED_ENTRY), { kind: 'ignore' })
  assert.deepEqual(keyAction(key('7', { repeat: true }), true, open), { kind: 'block' })
  assert.deepEqual(keyAction(key('Backspace', { repeat: true }), true, open), { kind: 'block' })
})

t('Cmd / Ctrl / Alt combinations ignored always', () => {
  for (const m of ['metaKey', 'ctrlKey', 'altKey']) {
    assert.deepEqual(keyAction(key('1', { [m]: true }), true, CLOSED_ENTRY), { kind: 'ignore' })
    assert.deepEqual(keyAction(key('1', { [m]: true }), true, open), { kind: 'ignore' })
    assert.deepEqual(keyAction(key('Backspace', { [m]: true }), true, open), { kind: 'ignore' })
  }
  assert.deepEqual(keyAction(key('#', {}), true, open), { kind: 'dtmf', digit: '#' })   // Shift+3 is fine
})

t('keys typed in input / textarea / contenteditable ignored always', () => {
  assert.deepEqual(keyAction(key('1', { editable: true }), true, open), { kind: 'ignore' })
  assert.deepEqual(keyAction(key('Backspace', { editable: true }), true, open), { kind: 'ignore' })
  assert.deepEqual(keyAction(key('1', { editable: true }), true, CLOSED_ENTRY), { kind: 'ignore' })
  assert.equal(isEditableTarget({ tagName: 'INPUT' }), true)
  assert.equal(isEditableTarget({ tagName: 'textarea' }), true)
  assert.equal(isEditableTarget({ tagName: 'SELECT' }), true)
  assert.equal(isEditableTarget({ tagName: 'DIV', isContentEditable: true }), true)
  assert.equal(isEditableTarget({ tagName: 'BUTTON' }), false)
  assert.equal(isEditableTarget(null), false)
})

/* ── wiring (source checks) ──────────────────────────────────────────────── */
const hook = read('src/hooks/useLiveKitCall.ts')
const pad = read('src/components/call/IvrDialpad.tsx')

t('exactly ONE window keydown listener, registered once and reading live refs', () => {
  assert.equal(hook.match(/addEventListener\('keydown'/g).length, 1)
  const i = hook.indexOf("addEventListener('keydown'")
  const effect = hook.slice(hook.lastIndexOf('useEffect(', i), hook.indexOf('}, [])', i) + 6)
  assert.ok(effect.endsWith('}, [])'), 'listener effect has no deps (no re-registration)')
  assert.ok(effect.includes('stateRef.current.mode') && effect.includes('entryRef.current'))
})

t('one press → exactly one publishData; pressDTMF reads live status', () => {
  const fn = hook.slice(hook.indexOf('const pressDTMF = useCallback'), hook.indexOf('const clearEntry = useCallback'))
  assert.equal(fn.match(/publishData\(/g).length, 1)
  assert.ok(fn.includes('stateRef.current.status'))
  assert.ok(!fn.includes('state.status'))
  assert.ok(fn.includes('clearTimeout(lastDigitTimer.current)'))
  assert.ok(fn.includes('logKey(before, digit)'))
})

t('numeric_entry handled; unknown types still fall to default', () => {
  assert.ok(hook.includes("case 'numeric_entry':"))
  assert.ok(hook.includes('default:\n        addLog(`Data: '))
})

t('Clear sends dtmf_clear only for an open, clearable entry', () => {
  const fn = hook.slice(hook.indexOf('const clearEntry = useCallback'), hook.indexOf('useEffect(() => { keyHandlersRef'))
  assert.ok(fn.includes("type: 'dtmf_clear'"))
  assert.ok(fn.includes('!cur.open || !cur.canClear'))
})

t('Reconnected restores connected; entry emptied on disconnect and new call', () => {
  assert.ok(/RoomEvent\.Reconnected,[^]*?patch\(\{ status: 'connected' \}\)/.test(hook))
  assert.ok((hook.match(/setEntry\(CLOSED_ENTRY\)/g) || []).length >= 3)
})

t('nothing stored: no localStorage / sessionStorage / analytics in the entry code', () => {
  for (const src of [read('src/lib/keypadEntry.ts'), pad]) {
    assert.ok(!/localStorage|sessionStorage|gtag|analytics|console\./.test(src))
  }
})

t('pad: display only while open, theme tokens only, Sent label kept otherwise', () => {
  assert.ok(pad.includes('{entry && entryOpen && ('))
  assert.ok(pad.includes('{lastDigit && !entryOpen && ('))
  assert.ok(pad.includes('Sent: {lastDigit}'))
  const block = pad.slice(pad.indexOf('KP1: entry display'), pad.indexOf('{/* Grid */}'))
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgb\(/.test(block), 'no hard-coded colours')
})

console.log(`\n${passed} passed`)
