// src/lib/auth.ts token refresh (C5) — unit tests (no extra deps). Run (Node 20): node scripts/test_auth_refresh.mjs
// localStorage, window.location and fetch are in-memory fakes; tokens are dummy strings.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/lib/auth.ts'), 'utf8')
  .replace('import { getEnv } from "./env"', "const getEnv = () => ({ serviceB: 'https://b.test', serviceI: 'https://i.test' })")
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText

let passed = 0
const t = async (name, fn) => { await fn(); passed++; console.log('PASS', name) }

/** Fresh module + fakes. routes: (url, init, n) => {status, body}; returns the env. */
async function setup(routes, { loggedIn = true } = {}) {
  const store = new Map()
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k),
  }
  globalThis.window = { location: { hostname: 'app.test', href: '/migrate' } }
  if (loggedIn) {
    store.set('cx_access_token', 'old-access'); store.set('cx_refresh_token', 'refresh-1'); store.set('cx_user', '{"id":8}')
  }
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), auth: (init.headers || {}).Authorization, ctype: (init.headers || {})['Content-Type'], body: init.body })
    const r = await routes(String(url), init, calls.length)
    if (r === 'network') throw new TypeError('network')
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body, text: async () => JSON.stringify(r.body ?? {}) }
  }
  const M = await import('data:text/javascript;base64,' + Buffer.from(js + `\n//${Math.random()}`).toString('base64'))
  return { M, store, calls, refreshCalls: () => calls.filter(c => c.url.endsWith('/auth/refresh')).length }
}

// Service B fake: accepts only `valid` as the current access token; refresh hands out new-access-N.
function serviceB({ refreshStatus = 200, alwaysUnauthorized = false } = {}) {
  let n = 0
  const valid = new Set()
  return (url, init) => {
    if (url.endsWith('/auth/refresh')) {
      if (refreshStatus !== 200) return { status: refreshStatus, body: { detail: 'bad' } }
      n += 1; const tok = `new-access-${n}`; valid.add(tok)
      return { status: 200, body: { access_token: tok, expires_in: 28800, token_type: 'bearer' } }
    }
    const auth = (init.headers || {}).Authorization || ''
    if (!alwaysUnauthorized && valid.has(auth.replace('Bearer ', ''))) return { status: 200, body: { ok: true, status: 'complete' } }
    return { status: 401, body: { detail: 'expired' } }
  }
}

await t('success after refresh: retried once with the new token', async () => {
  const e = await setup(serviceB())
  const data = await e.M.fetchB('/migrate/status')
  assert.equal(data.status, 'complete')
  assert.deepEqual(e.calls.map(c => [c.url.replace('https://b.test', ''), c.auth]),
    [['/migrate/status', 'Bearer old-access'], ['/auth/refresh', undefined], ['/migrate/status', 'Bearer new-access-1']])
  assert.equal(e.store.get('cx_access_token'), 'new-access-1')
})
await t('refresh MERGES: refresh token and user are kept (no saveAuth of the response)', async () => {
  const e = await setup(serviceB())
  await e.M.fetchB('/migrate/status')
  assert.equal(e.store.get('cx_refresh_token'), 'refresh-1')
  assert.equal(e.store.get('cx_user'), '{"id":8}')
})
await t('two consecutive refreshes both succeed with the same refresh token (no rotation)', async () => {
  const e = await setup(serviceB())
  await e.M.fetchB('/migrate/status')
  e.store.set('cx_access_token', 'expired-again')
  await e.M.fetchB('/migrate/status')
  assert.equal(e.refreshCalls(), 2)
  assert.ok(e.calls.filter(c => c.url.endsWith('/auth/refresh')).every(c => JSON.parse(c.body).refresh_token === 'refresh-1'))
  assert.equal(e.store.get('cx_access_token'), 'new-access-2')
})
await t('refresh fails → session cleared and /login (not upload cards)', async () => {
  const e = await setup(serviceB({ refreshStatus: 401 }))
  await assert.rejects(e.M.fetchB('/migrate/status'), err => err instanceof e.M.ApiError && err.status === 401)
  assert.equal(window.location.href, '/login')
  assert.equal(e.store.size, 0)
})
await t('concurrent 401s → exactly one refresh, all retried', async () => {
  const e = await setup(serviceB())
  const out = await Promise.all([e.M.fetchB('/a'), e.M.fetchB('/b'), e.M.fetchB('/c')])
  assert.equal(e.refreshCalls(), 1)
  assert.ok(out.every(d => d.ok))
})
await t('logged-out 401 → no refresh, no redirect, no Authorization header', async () => {
  const e = await setup(serviceB(), { loggedIn: false })
  await assert.rejects(e.M.fetchB('/livekit/token'), err => err.status === 401)
  assert.equal(e.refreshCalls(), 0)
  assert.equal(window.location.href, '/migrate')
  assert.equal(e.calls[0].auth, undefined)
})
await t('retry once, no loop: still 401 after a good refresh → error, one refresh', async () => {
  const e = await setup(serviceB({ alwaysUnauthorized: true }))
  await assert.rejects(e.M.fetchB('/migrate/status'), err => err.status === 401)
  assert.equal(e.refreshCalls(), 1)
  assert.equal(e.calls.length, 3)
})
await t('network error during refresh keeps the session (no redirect)', async () => {
  const e = await setup((url, init) => (url.endsWith('/auth/refresh') ? 'network' : { status: 401, body: {} }))
  await assert.rejects(e.M.fetchB('/migrate/status'))
  assert.equal(window.location.href, '/migrate')
  assert.equal(e.store.get('cx_refresh_token'), 'refresh-1')
})
await t('fetchI retries after refresh', async () => {
  const e = await setup(serviceB())
  const d = await e.M.fetchI('/sessions', { limit: 5 })
  assert.equal(d.ok, true)
  assert.equal(e.refreshCalls(), 1)
  assert.ok(e.calls[0].url.startsWith('https://i.test/sessions'))
})
await t('error message keeps the /migrate format "<status>: <body>"; FormData gets no JSON content type', async () => {
  const e = await setup(() => ({ status: 500, body: { detail: 'boom' } }))
  await assert.rejects(e.M.fetchB('/x'), err => err.message === '500: {"detail":"boom"}')
  const e2 = await setup(() => ({ status: 200, body: {} }))
  await e2.M.fetchB('/upload', { method: 'POST', body: new FormData() })
  assert.equal(e2.calls[0].ctype, undefined)
})

console.log(`\n${passed} passed`)
