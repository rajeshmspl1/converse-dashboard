// src/lib/partner.ts — unit tests (no extra deps). Run (Node 20): node scripts/test_partner_runtime.mjs
// react and the registry are stubbed; only synthetic hosts/ids are used.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/lib/partner.ts'), 'utf8')
  .replace("import { useEffect, useState } from 'react'", 'const useEffect = () => {}; const useState = (v) => [v, () => {}]')
  .replace("import { partnerForHost } from '@/config/partners'",
    "const partnerForHost = (h) => (h === 'p1.example.com' ? { id: 'p1', apiEnv: 'staging' } : null)")
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const load = async () => import('data:text/javascript;base64,' + Buffer.from(js + `\n//${Math.random()}`).toString('base64'))

let passed = 0
const t = async (name, fn) => { await fn(); passed++; console.log('PASS', name) }
const setHost = (h, fetchImpl) => { globalThis.window = { location: { hostname: h } }; globalThis.fetch = fetchImpl }
const okJson = (body) => async () => ({ ok: true, json: async () => body })

const M0 = await load()
await t('parse: valid fields', () => {
  assert.deepEqual(M0.parsePartnerAppConfig({ post_login: '/migrate', demo_tenant_key: 'demo_t', demo_display_name: 'Demo Name', hide_reset: true }),
    { postLogin: '/migrate', demoTenantKey: 'demo_t', demoDisplayName: 'Demo Name', hideReset: true })
})
await t('parse: post_login open-redirect and junk rejected', () => {
  for (const p of ['//evil.com', 'https://evil.com', 'migrate', '/a?b', '/a b', '/../x', 'javascript:x', '/\\evil'])
    assert.equal(M0.parsePartnerAppConfig({ post_login: p }).postLogin, null, p)
})
await t('parse: bad tenant key / non-boolean hide_reset / garbage', () => {
  const c = M0.parsePartnerAppConfig({ demo_tenant_key: 'Bad Key', hide_reset: 'true' })
  assert.equal(c.demoTenantKey, null); assert.equal(c.hideReset, false)
  assert.deepEqual(M0.parsePartnerAppConfig(null), { postLogin: null, demoTenantKey: null, demoDisplayName: null, hideReset: false })
})
await t('tenantLabel: demo name only for the demo tenant; else today\'s label', () => {
  const cfg = { postLogin: null, demoTenantKey: 'demo_t', demoDisplayName: 'Demo Name', hideReset: false }
  assert.equal(M0.tenantLabel('demo_t', cfg), 'Demo Name')
  assert.equal(M0.tenantLabel('other_bank_x', cfg), 'other bank x')
  assert.equal(M0.tenantLabel('demo_t', null), 'demo t')
})
await t('SSR: no window → no partner', () => { delete globalThis.window; assert.equal(M0.currentPartnerId(), null) })
await t('non-partner host: fallback, config never fetched', async () => {
  const M = await load(); let fetched = 0
  setHost('staging.example.com', async () => { fetched++; return { ok: true, json: async () => ({}) } })
  assert.equal(await M.postLoginPath('/dashboard'), '/dashboard'); assert.equal(fetched, 0)
  assert.equal(await M.loadPartnerConfig(), null)
})
await t('partner host: post_login used for password/OTP/already-logged-in', async () => {
  const M = await load(); setHost('p1.example.com', okJson({ post_login: '/migrate' }))
  assert.equal(await M.postLoginPath('/dashboard'), '/migrate')
  assert.equal(await M.postLoginPath('/migrate'), '/migrate')
})
await t('partner host: config unreachable or invalid post_login → fallback', async () => {
  let M = await load(); setHost('p1.example.com', async () => { throw new Error('net') })
  assert.equal(await M.postLoginPath('/dashboard'), '/dashboard')
  M = await load(); setHost('p1.example.com', okJson({ post_login: '//evil.com' }))
  assert.equal(await M.postLoginPath('/dashboard'), '/dashboard')
  M = await load(); setHost('p1.example.com', async () => ({ ok: false, json: async () => ({}) }))
  assert.equal(await M.postLoginPath('/dashboard'), '/dashboard')
})
await t('config fetched once per page (cached)', async () => {
  const M = await load(); let n = 0
  setHost('p1.example.com', async () => { n++; return { ok: true, json: async () => ({ post_login: '/migrate' }) } })
  await Promise.all([M.postLoginPath('/a'), M.loadPartnerConfig(), M.postLoginPath('/b')])
  assert.equal(n, 1)
})
await t('partner.ts has no tenant/partner names', () => assert.ok(!/sparrow|j_k_bank|demo bank/i.test(src)))

console.log(`\n${passed} passed`)
