// jk_r9_silent_r1 FIX 2 — unit tests for src/lib/callPresence.ts (no extra deps).
// Transpiles the TS module with the project's own `typescript`, then asserts.
// Run (Node 20):  node scripts/test_call_presence.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = readFileSync(path.join(here, '..', 'src', 'lib', 'callPresence.ts'), 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
const { HANDOFF_GRACE_MS, isHandoffParticipant, ivrModeAfterServiceDLeft, onAgentLeft, createGraceTimer } = mod

let passed = 0
const t = (name, fn) => { fn(); passed++; console.log('PASS', name) }

t('grace window is 8 s', () => assert.equal(HANDOFF_GRACE_MS, 8000))

t('hand-off participants', () => {
  assert.ok(isHandoffParticipant('service-d-audio_room_1'))
  assert.ok(isHandoffParticipant('agent-AJ_x'))
  assert.ok(!isHandoffParticipant('web_user_1'))
  assert.ok(!isHandoffParticipant('EG_abc'))
})

t('FIX 2a: D leaves with agent present keeps IVR flag (R9 hand-back)', () => {
  assert.equal(ivrModeAfterServiceDLeft(true, true), true)
  assert.equal(ivrModeAfterServiceDLeft(false, true), false)
})

t('D leaves with no agent clears IVR flag', () => {
  assert.equal(ivrModeAfterServiceDLeft(true, false), false)
})

t('agent leaves while IVR armed → stay', () => assert.equal(onAgentLeft(true, []), 'stay'))
t('agent leaves while D already in room → stay', () =>
  assert.equal(onAgentLeft(false, ['web_user_1', 'service-d-audio_r']), 'stay'))
t('agent leaves, nobody else, flag clear → grace (not immediate hang-up)', () =>
  assert.equal(onAgentLeft(false, ['web_user_1', 'EG_x']), 'grace'))

// Fake clock for the timer
function fakeClock() {
  let now = 0, id = 0
  const timers = new Map()
  return {
    setTimeoutFn: (fn, ms) => { id++; timers.set(id, { fn, at: now + ms }); return id },
    clearTimeoutFn: (h) => { timers.delete(h) },
    advance(ms) {
      now += ms
      for (const [k, v] of [...timers]) if (v.at <= now) { timers.delete(k); v.fn() }
    },
  }
}

t('FIX 2b: grace fires only after 8 s', () => {
  const c = fakeClock(); let hung = 0
  const g = createGraceTimer(() => hung++, HANDOFF_GRACE_MS, c)
  g.arm(); c.advance(1500); assert.equal(hung, 0, 'old 1.5 s rule must not hang up')
  c.advance(6499); assert.equal(hung, 0); c.advance(1); assert.equal(hung, 1); assert.equal(g.armed, false)
})

t('FIX 2b: D joining at +2.1 s (the incident) cancels the hang-up', () => {
  const c = fakeClock(); let hung = 0
  const g = createGraceTimer(() => hung++, HANDOFF_GRACE_MS, c)
  g.arm(); c.advance(2100)
  assert.ok(isHandoffParticipant('service-d-audio_j_room') && g.cancel())
  c.advance(20000); assert.equal(hung, 0)
})

t('re-arm restarts the window; cancel when idle is a no-op', () => {
  const c = fakeClock(); let hung = 0
  const g = createGraceTimer(() => hung++, 8000, c)
  assert.equal(g.cancel(), false)
  g.arm(); c.advance(5000); g.arm(); c.advance(5000); assert.equal(hung, 0); c.advance(3000); assert.equal(hung, 1)
})

console.log(`\n${passed} passed`)
