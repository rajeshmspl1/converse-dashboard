// src/lib/auth.ts signOut() + back/forward-cache guard — unit tests (no extra deps).
// Run (Node 20): node scripts/test_auth_signout.mjs
// window / storage / fetch are stubbed; no real tokens are used.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const authSrc = readFileSync(path.join(root, 'src/lib/auth.ts'), 'utf8')
const js = ts.transpileModule(
  authSrc.replace('import { getEnv } from "./env"', "const getEnv = () => ({ serviceB: 'https://b.example', serviceI: 'https://i.example' })"),
  { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText

class Store {
  constructor(init = {}) { this.m = new Map(Object.entries(init)) }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null }
  setItem(k, v) { this.m.set(k, String(v)) }
  removeItem(k) { this.m.delete(k) }
  get length() { return this.m.size }
  key(i) { return [...this.m.keys()][i] ?? null }
  keys() { return [...this.m.keys()].sort() }
}
const LOGIN = { cx_access_token: 'a.b.c', cx_refresh_token: 'r.s.t', cx_user: JSON.stringify({ id: 1, email: 'u@example.com' }) }
const R174 = { cx_tenant_key: 'tenant_x', cx_ivr_key: 'ivr_x', cx_routing_mode: 'sales' }

function env({ local = {}, session = {}, search = '' } = {}) {
  const calls = { assign: [], replace: [], href: [] }
  const listeners = {}
  const location = {
    search, hostname: 'p1.example.com',
    assign: (u) => calls.assign.push(u), replace: (u) => calls.replace.push(u),
    set href(u) { calls.href.push(u) }, get href() { return 'https://p1.example.com/migrate' + search },
  }
  globalThis.window = {
    location,
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f) },
    removeEventListener: (t, f) => { listeners[t] = (listeners[t] || []).filter(x => x !== f) },
  }
  globalThis.localStorage = new Store(local)
  globalThis.sessionStorage = new Store(session)
  return { calls, listeners }
}
env()
const A = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let passed = 0
const t = async (name, fn) => { await fn(); passed++; console.log('PASS', name) }

await t('signOut clears tokens, user, legacy access_token and R174 keys in localStorage AND sessionStorage', () => {
  const { calls } = env({ local: { ...LOGIN, ...R174, access_token: 'legacy', cvs_session_X: '{}', theme: 'dark' },
                          session: { ...LOGIN, ...R174, cvs_session_Y: '{}' } })
  A.signOut()
  assert.deepEqual(localStorage.keys(), ['cvs_session_X', 'theme'], 'unrelated keys stay')
  assert.deepEqual(sessionStorage.keys(), ['cvs_session_Y'])
  assert.deepEqual(calls.assign, ['/'])
})
await t('signOut destination is fixed "/" — the URL is never read (no open redirect)', () => {
  for (const search of ['?next=https://evil.example', '?redirect=//evil.example', '?returnTo=/migrate']) {
    const { calls } = env({ local: LOGIN, search })
    A.signOut()
    assert.deepEqual(calls.assign, ['/'], search); assert.deepEqual(calls.href, []); assert.deepEqual(calls.replace, [])
  }
  assert.equal(A.SIGN_OUT_DESTINATION, '/')
  const body = authSrc.slice(authSrc.indexOf('export function signOut'), authSrc.indexOf('export function guardBackForwardCache'))
  assert.ok(!/location\.(search|href|hash)|URLSearchParams|document\.referrer/.test(body), 'signOut reads nothing from the URL')
})
await t('signOut is a full page load: location.assign, no router/setState inside', () => {
  const body = authSrc.slice(authSrc.indexOf('export function signOut'), authSrc.indexOf('export function guardBackForwardCache'))
  assert.ok(body.includes("window.location.assign(SIGN_OUT_DESTINATION)"))
  assert.ok(!/router|set[A-Z]\w*\(/.test(body))
})
await t('signOut still navigates when storage throws', () => {
  const { calls } = env({ local: LOGIN })
  sessionStorage.removeItem = () => { throw new Error('blocked') }
  A.signOut()
  assert.deepEqual(calls.assign, ['/']); assert.equal(localStorage.getItem('cx_access_token'), null)
})
await t('clearAuth is unchanged: removes only the 3 login keys (R174 keys untouched), no navigation', () => {
  const { calls } = env({ local: { ...LOGIN, ...R174 }, session: R174 })
  A.clearAuth()
  assert.deepEqual(localStorage.keys(), Object.keys(R174).sort()); assert.deepEqual(sessionStorage.keys(), Object.keys(R174).sort())
  assert.deepEqual(calls, { assign: [], replace: [], href: [] })
})
await t('401 path unchanged: refresh rejected → clearAuth + /login (not "/")', async () => {
  const { calls } = env({ local: LOGIN })
  globalThis.fetch = async (url) => ({ ok: false, status: 401, json: async () => ({}), text: async () => '' })
  const res = await A.authFetch('https://b.example/x')
  assert.equal(res.status, 401)
  assert.deepEqual(calls.href, ['/login']); assert.deepEqual(calls.assign, [])
  assert.equal(localStorage.getItem('cx_access_token'), null)
})
await t('back/forward cache: persisted pageshow while logged out → replace("/"); logged in or fresh load → nothing', () => {
  let e = env({ local: {} })
  const stop = A.guardBackForwardCache()
  e.listeners.pageshow[0]({ persisted: true }); assert.deepEqual(e.calls.replace, ['/'])
  e.listeners.pageshow[0]({ persisted: false }); assert.deepEqual(e.calls.replace, ['/'])
  stop(); assert.equal(e.listeners.pageshow.length, 0)
  e = env({ local: LOGIN })
  A.guardBackForwardCache()
  e.listeners.pageshow[0]({ persisted: true }); assert.deepEqual(e.calls.replace, [])
})

// Wiring: every user sign-out handler calls signOut(); no duplicate clear-and-redirect handlers remain.
const files = []
const walk = d => { for (const f of readdirSync(d)) { const p = path.join(d, f); statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && files.push(p) } }
walk(path.join(root, 'src'))
const rel = p => path.relative(root, p)
await t('every handleSignOut / onSignOut handler uses signOut()', () => {
  let n = 0
  for (const f of files) {
    const s = readFileSync(f, 'utf8')
    for (const m of s.matchAll(/const handleSignOut\s*=\s*([^\n]+)/g)) { n++; assert.match(m[1], /signOut/, `${rel(f)}: ${m[1]}`) }
    for (const m of s.matchAll(/onSignOut=\{([^}]+)\}/g)) { n++; assert.match(m[1], /^(signOut|handleSignOut)$/, `${rel(f)}: ${m[1]}`) }
  }
  assert.ok(n >= 7, `found ${n} handlers`)
})
await t('clearAuth() outside auth.ts only on 401 paths (followed by /login)', () => {
  for (const f of files) {
    if (rel(f) === path.join('src', 'lib', 'auth.ts')) continue
    const s = readFileSync(f, 'utf8')
    for (const m of s.matchAll(/clearAuth\(\)/g)) {
      const ctx = s.slice(Math.max(0, m.index - 80), m.index + 80)
      assert.ok(/status === 401/.test(ctx) && /'\/login'/.test(ctx), `${rel(f)}: ${ctx.replace(/\s+/g, ' ')}`)
    }
  }
})
await t('no other code clears login storage directly', () => {
  for (const f of files) {
    if (rel(f) === path.join('src', 'lib', 'auth.ts')) continue
    const s = readFileSync(f, 'utf8')
    assert.ok(!/(localStorage|sessionStorage)\.(clear\(\)|removeItem\(\s*['"](cx_|access_token))/.test(s), rel(f))
  }
})
await t('UnifiedHeader installs the back/forward-cache guard on logged-in pages', () => {
  const s = readFileSync(path.join(root, 'src/components/layout/UnifiedHeader.tsx'), 'utf8')
  assert.ok(s.includes('useEffect(() => (isLoggedIn ? guardBackForwardCache() : undefined), [isLoggedIn])'))
})

console.log(`\n${passed} passed`)
