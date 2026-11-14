// jk_j2j4_r1 — unit tests for src/lib/crmIndustry.ts (no extra deps).
// Transpiles the TS module with the project's own `typescript`, then asserts.
// Run (Node 20):  node scripts/test_crm_industry.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = readFileSync(path.join(here, '..', 'src', 'lib', 'crmIndustry.ts'), 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
const { industryFromIvrKey, resolveCrmIndustry, demoProfileUrl, _resetCrmIndustryCache } = mod

let passed = 0
const t = async (name, fn) => { _resetCrmIndustryCache(); await fn(); passed++; console.log('PASS', name) }
const fakeFetch = (reply, calls, ok = true) => async (url, init) => {
  calls.push({ url, init })
  if (reply instanceof Error) throw reply
  return { ok, json: async () => reply }
}

await t('global_<industry> resolves locally (no fetch)', async () => {
  const calls = []
  assert.equal(await resolveCrmIndustry('http://b', 't', 'global_banking', fakeFetch({}, calls)), 'banking')
  assert.equal(calls.length, 0)
  assert.equal(industryFromIvrKey('global_unknown'), null)
  assert.equal(industryFromIvrKey('retail'), null)
})

await t('other IVR keys ask Service B with the tenant header, cached', async () => {
  const calls = []
  const f = fakeFetch({ ok: true, industry: 'banking', source: 'intents' }, calls)
  assert.equal(await resolveCrmIndustry('http://b', 'tenant_x', 'retail', f), 'banking')
  assert.equal(calls[0].url, 'http://b/ivr/industry?ivr_key=retail')
  assert.deepEqual(calls[0].init.headers, { 'X-Tenant-Key': 'tenant_x' })
  await resolveCrmIndustry('http://b', 'tenant_x', 'retail', f)
  assert.equal(calls.length, 1)
})

await t('unresolved / error / non-200 → null (never "retail", never a default)', async () => {
  assert.equal(await resolveCrmIndustry('http://b', 't', 'retail', fakeFetch({ industry: null }, [])), null)
  _resetCrmIndustryCache()
  assert.equal(await resolveCrmIndustry('http://b', 't', 'retail', fakeFetch(new Error('down'), [])), null)
  _resetCrmIndustryCache()
  assert.equal(await resolveCrmIndustry('http://b', 't', 'retail', fakeFetch({ industry: 'banking' }, [], false)), null)
})

await t('demo-profile URL uses the resolved industry + optional tier class', async () => {
  assert.equal(demoProfileUrl('http://f', 'India', 'banking'), 'http://f/crm/demo-profile?country=India&industry=banking')
  assert.equal(demoProfileUrl('http://f', 'India', 'banking', 'AT_RISK'),
    'http://f/crm/demo-profile?country=India&industry=banking&classification=AT_RISK')
})

await t('page.tsx: both demo-profile fetches go through the resolver', async () => {
  const page = readFileSync(path.join(here, '..', 'src', 'app', 'experience', 'page.tsx'), 'utf8')
  assert.equal((page.match(/resolveCrmIndustry\(SERVICE_B_URL/g) || []).length, 2)
  assert.ok(!page.includes(".replace('global_', '')\n    // R157"), 'old ivr-derived industry removed')
  assert.ok(!/industry=\$\{ind(ustry)?\}/.test(page), 'no raw ivr-key industry in URLs')
})

console.log(`\n${passed}/5 passed`)
