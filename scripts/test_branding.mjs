// B2 frontend: src/lib/color.ts (parity with public/partners/template.js), src/lib/branding.ts,
// src/lib/roles.ts (parity with service-b roles.py), and wiring of the header / Team / Account pages.
// Run (Node 20): node scripts/test_branding.mjs
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'
import * as TPL from '../public/partners/template.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = f => readFileSync(path.join(root, f), 'utf8')
const tsMod = async (src) => import('data:text/javascript;base64,' + Buffer.from(
  ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
  + `\n//${Math.random()}`).toString('base64'))

let passed = 0
const t = async (name, fn) => { await fn(); passed++; console.log('PASS', name) }

// ── color.ts ──
const themeBg = /bg:\s*'(#[0-9A-Fa-f]{6})'/.exec(read('src/lib/theme.ts'))[1]
const C = await tsMod(read('src/lib/color.ts').replace("import { SURFACES } from './theme'", `const SURFACES = { bg: '${themeBg}' }`))
const COLOURS = ['#000000', '#FFFFFF', '#634057', '#467779', '#7A4564', '#F54D1D', '#5B8C8F', '#310627', '#00C9B1', '#3370E8', '#777777', themeBg]

await t('color.ts contrast == template.js contrast for the same colours', () => {
  for (const a of COLOURS) for (const b of COLOURS) assert.equal(C.contrastRatio(a, b), TPL.contrastRatio(a, b), `${a}/${b}`)
  assert.equal(C.MIN_TEXT_CONTRAST, TPL.MIN_CONTRAST_TEXT)
  for (const c of COLOURS) assert.equal(C.contrastRatio(c, '#FFFFFF') >= 4.5, TPL.whiteTextBackground(c) !== null, c)
})
await t('known ratios (same numbers as the CX Lab rounds)', () => {
  const r = (a, b) => Math.round(C.contrastRatio(a, b) * 100) / 100
  assert.equal(r('#000000', '#FFFFFF'), 21)
  assert.equal(r('#F54D1D', '#FFFFFF'), 3.52)
  assert.equal(r('#7A4564', '#FFFFFF'), 7.34)
  assert.equal(r('#5B8C8F', '#FFFFFF'), 3.75)
})
await t('button text: white or near-black, whichever contrasts more', () => {
  assert.equal(C.buttonTextColor('#000000'), '#FFFFFF')
  assert.equal(C.buttonTextColor('#FFFFFF'), C.NEAR_BLACK)
  assert.equal(C.buttonTextColor('#F54D1D'), C.NEAR_BLACK) // white 3.52 < near-black
  assert.equal(C.buttonTextColor('#7A4564'), '#FFFFFF')
  for (const c of COLOURS) {
    const tx = C.buttonTextColor(c), other = tx === '#FFFFFF' ? C.NEAR_BLACK : '#FFFFFF'
    assert.ok(C.contrastRatio(c, tx) >= C.contrastRatio(c, other), c)
  }
})
await t('accent text is lightened until >= 4.5:1 on the dark surface', () => {
  for (const c of COLOURS) {
    const out = C.readableAccent(c)
    assert.ok(C.contrastRatio(out, themeBg) >= 4.5, `${c} → ${out}`)
    if (C.contrastRatio(c, themeBg) >= 4.5) assert.equal(out, c.toUpperCase(), 'already readable → unchanged')
  }
  assert.notEqual(C.readableAccent('#7A4564'), '#7A4564') // dark purple on dark → lightened
  assert.equal(C.readableAccent('not-a-colour'), '#FFFFFF')
})

// ── branding.ts (auth / env / partner stubbed) ──
let fetchBImpl = async () => ({}), authFetchImpl = async () => null
globalThis.__fetchB = (...a) => fetchBImpl(...a)
globalThis.__authFetch = (...a) => authFetchImpl(...a)
class Store { constructor() { this.m = new Map() } getItem(k) { return this.m.has(k) ? this.m.get(k) : null } setItem(k, v) { this.m.set(k, String(v)) } removeItem(k) { this.m.delete(k) } }
globalThis.sessionStorage = new Store()
let blobN = 0
globalThis.URL.createObjectURL = () => `blob:test/${++blobN}`
const B = await tsMod(read('src/lib/branding.ts')
  .replace("import { BRANDING_CACHE_PREFIX, authFetch, fetchB, type CxUser } from './auth'",
    "const BRANDING_CACHE_PREFIX = 'cx_branding'; const fetchB = (...a) => globalThis.__fetchB(...a); const authFetch = (...a) => globalThis.__authFetch(...a)")
  .replace("import { getEnv } from './env'", "const getEnv = () => ({ serviceB: 'https://b.example' })")
  .replace("import { isHex } from './color'", "const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)")
  .replace("import type { PartnerAppConfig } from './partner'", ''))
const SHA = 'a'.repeat(64)
const GOOD_LOGO = `/branding/asset/partner/cxplab/logo/${SHA}`

await t('sanitizeBranding keeps valid fields only (text stays text)', () => {
  const b = B.sanitizeBranding({ display_name: ' Demo Bank ', colors: { accent: '#f54d1d', primary: 'red;x', dark: '#000000', evil: '#123456' },
    logo_url: GOOD_LOGO, logo_plate: 'light', extra: 1 })
  assert.deepEqual(b, { display_name: 'Demo Bank', colors: { accent: '#F54D1D', dark: '#000000' }, logo_url: GOOD_LOGO, logo_plate: 'light' })
  assert.equal(B.sanitizeBranding({ display_name: '<img src=x onerror=alert(1)>' }).display_name, '<img src=x onerror=alert(1)>')
  for (const u of ['javascript:alert(1)', 'https://evil.example/x.png', '//evil/x', `/branding/asset/partner/cxplab/logo/${SHA}?x=1`,
                   `/branding/asset/partner/../logo/${SHA}`, `/branding/asset/partner/cxplab/favicon/${SHA}`, `/branding/asset/x/y/logo/${SHA}`])
    assert.equal(B.sanitizeBranding({ logo_url: u }).logo_url, undefined, u)
  assert.deepEqual(B.sanitizeBranding({ display_name: 'x'.repeat(61), logo_plate: 'dark' }), {})
  assert.deepEqual(B.sanitizeBranding(null), {})
})
await t('display name order: branding → partner demo name → company_name → never the raw key', () => {
  const partner = { demoTenantKey: 'sparrow_demo', demoDisplayName: 'Demo Bank', postLogin: null, hideReset: true }
  const u = { tenant_key: 'sparrow_demo', company_name: 'Co Ltd' }
  assert.equal(B.displayNameFor(u, { display_name: 'Brand Name' }, partner), 'Brand Name')
  assert.equal(B.displayNameFor(u, {}, partner), 'Demo Bank')
  assert.equal(B.displayNameFor({ tenant_key: 'j_k_bank_contact_center', company_name: 'J&K Bank' }, {}, partner), 'J&K Bank')
  assert.equal(B.displayNameFor({ tenant_key: 'j_k_bank_contact_center', company_name: '' }, {}, null), null)
  assert.equal(B.displayNameFor(null, {}, null), null)
})
await t('cache key = user id + tenant_key; a cached entry for another user/tenant is never used', async () => {
  assert.equal(B.cacheKey({ id: 7, tenant_key: 'tenant_a' }), 'cx_branding:7:tenant_a')
  let calls = 0
  fetchBImpl = async () => { calls++; return { tenant_key: 'tenant_a', branding: { display_name: 'A Bank' } } }
  const ua = { id: 7, tenant_key: 'tenant_a' }
  assert.deepEqual(await B.loadBranding(ua), { display_name: 'A Bank' })
  assert.deepEqual(await B.loadBranding(ua), { display_name: 'A Bank' }); assert.equal(calls, 1, 'second call from cache')
  sessionStorage.setItem('cx_branding:8:tenant_b', JSON.stringify({ uid: 7, tenant: 'tenant_a', branding: { display_name: 'A Bank' } }))
  fetchBImpl = async () => { calls++; return { tenant_key: 'tenant_b', branding: { display_name: 'B Bank' } } }
  assert.deepEqual(await B.loadBranding({ id: 8, tenant_key: 'tenant_b' }), { display_name: 'B Bank' }, 'mismatched entry ignored')
  fetchBImpl = async () => ({ tenant_key: 'someone_else', branding: { display_name: 'Wrong' } })
  assert.deepEqual(await B.loadBranding({ id: 9, tenant_key: 'tenant_c' }), {}, 'response for another tenant ignored')
  fetchBImpl = async () => { throw new Error('boom') }
  assert.deepEqual(await B.loadBranding({ id: 10, tenant_key: 'tenant_d' }), {})
})
await t('logo blob: fetched with the token, PNG/JPEG only, bad URLs never fetched', async () => {
  let fetched = []
  const resp = (type, ok = true) => ({ ok, headers: { get: () => type }, blob: async () => new Blob(['x'], { type }) })
  authFetchImpl = async (u) => { fetched.push(u); return resp('image/png') }
  assert.equal(await B.fetchLogoBlobUrl(GOOD_LOGO), `blob:test/${blobN}`)
  assert.deepEqual(fetched, [`https://b.example${GOOD_LOGO}`])
  for (const type of ['image/svg+xml', 'text/html', 'image/gif', '']) {
    authFetchImpl = async () => resp(type)
    assert.equal(await B.fetchLogoBlobUrl(GOOD_LOGO), null, type)
  }
  authFetchImpl = async () => resp('image/jpeg; charset=binary'); assert.ok(await B.fetchLogoBlobUrl(GOOD_LOGO))
  authFetchImpl = async () => resp('image/png', false); assert.equal(await B.fetchLogoBlobUrl(GOOD_LOGO), null)
  fetched = []; authFetchImpl = async (u) => { fetched.push(u); return resp('image/png') }
  assert.equal(await B.fetchLogoBlobUrl('https://evil.example/logo.png'), null); assert.deepEqual(fetched, [])
})
await t('logo plate: auto/light → plate on the dark header, none → no plate', () => {
  assert.equal(B.wantsPlate(undefined), true); assert.equal(B.wantsPlate('light'), true); assert.equal(B.wantsPlate('none'), false)
})

// ── roles.ts ──
const R = await tsMod(read('src/lib/roles.ts'))
await t('roles.ts mapping == service-b roles.py LEGACY_ROLE_MAP', () => {
  const py = path.join(root, '..', 'wt-branding', 'service_b_api', 'app', 'roles.py')
  if (existsSync(py)) {
    const block = /LEGACY_ROLE_MAP = \{([\s\S]*?)\}/.exec(readFileSync(py, 'utf8'))[1]
    const pairs = Object.fromEntries([...block.matchAll(/"(\w+)":\s*(\w+)/g)].map(m => [m[1], { TENANT_ADMIN: 'tenant_admin', TESTER: 'tester', VIEWER: 'viewer' }[m[2]]]))
    assert.deepEqual(R.LEGACY_ROLE_MAP, pairs)
  }
  assert.equal(R.canonicalRole('customer_viewer'), 'viewer'); assert.equal(R.roleLabel('customer_tester'), 'Tester')
  assert.equal(R.roleLabel('analyst'), 'Tester'); assert.equal(R.roleLabel('tenant_manager'), 'Manager')
  assert.ok(R.isAdminRole('customer_admin')); assert.ok(!R.isAdminRole('tester'))
})

// ── wiring ──
const team = read('src/app/settings/team/page.tsx'), acct = read('src/app/account/page.tsx'), hdr = read('src/components/layout/UnifiedHeader.tsx')
await t('Team: shared fetchB, POST update/remove, canonical roles on send, no raw key', () => {
  assert.ok(team.includes('fetchB(path, opts)') && !team.includes('getAccessToken') && !/await fetch\(/.test(team), 'one auth client (R172)')
  assert.ok(team.includes("`/auth/users/${editMember.id}/update`, { method: 'POST'"))
  assert.ok(team.includes("`/auth/users/${removeMember.id}/remove`, { method: 'POST'"))
  assert.ok(!/method: '(PATCH|DELETE|PUT)'/.test(team))
  assert.ok(team.includes('role: canonicalRole(invRole)') && team.includes('role: canonicalRole(editRole)'))
  assert.ok(!team.includes('tenant_key?.toUpperCase()'))
})
await t('Account: POST me/update + account/delete with password; 12-char passwords', () => {
  assert.ok(acct.includes("'/auth/me/update', {") && acct.includes("method: 'POST'"))
  assert.ok(acct.includes("'/auth/account/delete', { method: 'POST', body: JSON.stringify({ password: deletePwd }) }"))
  assert.ok(acct.includes('const PASSWORD_MIN = 12') && acct.includes('newPwd.length < PASSWORD_MIN'))
  assert.ok(acct.includes('data-testid="delete-password"') && acct.includes('type="password"'))
  assert.ok(!/method: '(PATCH|DELETE|PUT)'/.test(acct) && !acct.includes('getAccessToken'))
  assert.ok(!acct.includes('user.tenant_key.toUpperCase()') && !acct.includes('{user.tenant_key}'))
})
await t('Header: tenant logo alt = display name, plate <= 32px, accent from branding, no raw key, Powered by', () => {
  assert.ok(hdr.includes('alt={brand.displayName ||'))
  assert.ok(/height: 30, padding: '3px 8px'/.test(hdr), 'plate 30px tall (header 44px)')
  assert.ok(hdr.includes('brand.accentText') && hdr.includes('Powered by AiIVRs'))
  assert.ok(!hdr.includes('{user.tenant_key}'))
})
await t('No HTML sinks in branding code', () => {
  for (const f of ['src/lib/branding.ts', 'src/components/branding/BrandingProvider.tsx', 'src/components/layout/UnifiedHeader.tsx', 'src/lib/color.ts'])
    assert.ok(!/dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML/.test(read(f)), f)
})
await t('Branding uses the shared fetchB (no second auth client)', () => {
  const b = read('src/lib/branding.ts')
  assert.ok(b.includes("fetchB('/branding/me')") && !b.includes('getAccessToken') && !/[^.]fetch\(/.test(b.replace(/authFetch\(/g, '')))
})

console.log(`\n${passed} passed`)
