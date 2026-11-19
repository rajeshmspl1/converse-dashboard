// Partner landing page + registry — unit tests (no extra deps). Run (Node 20): node scripts/test_partners.mjs
// Uses only synthetic partner ids; the real registry is checked for shape, not content.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'
import * as T from '../public/partners/template.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
let passed = 0
const t = (name, fn) => { fn(); passed++; console.log('PASS', name) }

const REG = { hosts: [{ host: 'p1.example.com', id: 'p1', apiEnv: 'staging' }, { host: 'bad.example.com', id: 'Bad Id', apiEnv: 'staging' }] }
const GOOD = {
  name: 'P One', logo: '/partners/p1/logo.svg', font: 'Open Sans',
  colours: { primary: '#310627', accent: '#F54D1D', secondary: '#4DBBC2', alert: '#F3061B' },
  hero_title: 'Title', hero_subtitle: 'Sub', cta_label: 'Try', journeys_title: 'Pick', contact_title: 'Talk',
  contact_text: 'Text', powered_by: 'Powered',
  journeys: [1, 2, 3, 4].map(n => ({ label: `L${n}`, outcome: `O${n}` })),
}

t('partner id from registry host', () => assert.equal(T.resolvePartnerId(REG, 'P1.example.com', ''), 'p1'))
t('?p= accepted only when it is a registry id', () => {
  assert.equal(T.resolvePartnerId(REG, 'other.host', '?p=p1'), 'p1')
  assert.equal(T.resolvePartnerId(REG, 'other.host', '?p=p2'), null)
})
t('bad ?p= values rejected (pattern, traversal, script)', () => {
  for (const p of ['../x', 'P1', 'p1/..', '<script>', 'p1%2F', '', 'a b']) assert.equal(T.resolvePartnerId(REG, 'x', `?p=${encodeURIComponent(p)}`), null, p)
})
t('registry entry with invalid id is ignored', () => assert.equal(T.resolvePartnerId(REG, 'bad.example.com', ''), null))
t('missing/garbage registry → null', () => {
  assert.equal(T.resolvePartnerId(null, 'p1.example.com', '?p=p1'), null)
  assert.equal(T.resolvePartnerId({ hosts: 'x' }, 'p1.example.com', ''), null)
})
t('colour validation', () => {
  for (const c of ['#310627', '#abcDEF']) assert.ok(T.isColour(c), c)
  for (const c of ['red', '#31062', '#3106277', 'url(x)', '#31062g', ';x', null]) assert.ok(!T.isColour(c), String(c))
})
t('logo path must stay under /partners/<id>/', () => {
  assert.equal(T.safeLogoPath('p1', '/partners/p1/logo.svg'), '/partners/p1/logo.svg')
  for (const p of ['/partners/p2/logo.svg', '/partners/p1/../x.svg', 'https://evil/x.svg', '//evil/x.svg', '/partners/p1//x', 'javascript:alert(1)', '/partners/p1/a b.svg'])
    assert.equal(T.safeLogoPath('p1', p), null, p)
})
t('valid config accepted', () => {
  const v = T.validateConfig('p1', GOOD)
  assert.equal(v.name, 'P One'); assert.equal(v.journeys.length, 4); assert.equal(v.logo, '/partners/p1/logo.svg')
})
t('bad colour rejects the whole config', () => {
  assert.equal(T.validateConfig('p1', { ...GOOD, colours: { ...GOOD.colours, accent: 'red;background:url(x)' } }), null)
})
t('missing text / wrong journey count rejected', () => {
  assert.equal(T.validateConfig('p1', { ...GOOD, hero_title: '' }), null)
  assert.equal(T.validateConfig('p1', { ...GOOD, journeys: GOOD.journeys.slice(0, 3) }), null)
  assert.equal(T.validateConfig('p1', { ...GOOD, journeys: [...GOOD.journeys.slice(0, 3), { label: 'x' }] }), null)
})
t('script in text is kept as plain text (rendered via textContent, never parsed)', () => {
  const v = T.validateConfig('p1', { ...GOOD, hero_title: '<img src=x onerror=alert(1)>' })
  assert.equal(v.hero_title, '<img src=x onerror=alert(1)>')
  const src = readFileSync(path.join(root, 'public/partners/template.js'), 'utf8')
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src), 'no HTML sinks in template.js')
})
t('bad font / logo are dropped, not injected', () => {
  const v = T.validateConfig('p1', { ...GOOD, font: "x');@import url(evil)", logo: '//evil/x.svg' })
  assert.equal(v.font, null); assert.equal(v.logo, null)
})
t('J1–J4 URLs: Experience Shop, journey + routing mode, no tenant', () => {
  assert.deepEqual([0, 1, 2, 3].map(T.journeyUrl), [
    '/experience?journey=0', '/experience?journey=1&routing_mode=sales',
    '/experience?journey=2&routing_mode=complexity', '/experience?journey=3&routing_mode=premium'])
  assert.ok([0, 1, 2, 3].every(n => !T.journeyUrl(n).includes('tenant')))
})
t('template page is noindex and has no partner-specific text', () => {
  const html = readFileSync(path.join(root, 'public/partners/template.html'), 'utf8')
  assert.ok(html.includes('<meta name="robots" content="noindex">'))
  const reg = JSON.parse(readFileSync(path.join(root, 'public/partners/registry.json'), 'utf8'))
  for (const h of reg.hosts) assert.ok(!html.includes(h.id) && !html.includes(h.host), 'template mentions a partner')
})

t('partner files avoid WAF-restricted names (CRS 930130 blocks *config.json)', () => {
  const sources = ['public/partners/template.js', 'src/lib/partner.ts'].map(f => readFileSync(path.join(root, f), 'utf8'))
  assert.ok(sources.every(src => src.includes('/partner.json') && !/\/[a-z._-]*config[._-][a-z.]*json/.test(src.replace(/\/\/.*$/gm, ''))))
  for (const h of JSON.parse(readFileSync(path.join(root, 'public/partners/registry.json'), 'utf8')).hosts)
    readFileSync(path.join(root, `public/partners/${h.id}/partner.json`), 'utf8')  // every registry id has partner.json
})

// src/config/partners.ts — transpiled with the registry inlined (pure data module).
const regJson = readFileSync(path.join(root, 'public/partners/registry.json'), 'utf8')
const psrc = readFileSync(path.join(root, 'src/config/partners.ts'), 'utf8')
  .replace(/import registry from '[^']+'/, `const registry = ${JSON.stringify(REG)}`)
const pjs = ts.transpileModule(psrc, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const P = await import('data:text/javascript;base64,' + Buffer.from(pjs).toString('base64'))
t('partners.ts: valid entries only, case-insensitive, www ignored', () => {
  assert.deepEqual(Object.keys(P.PARTNER_HOSTS), ['p1.example.com'])
  assert.deepEqual(P.partnerForHost('WWW.P1.example.com'), { id: 'p1', apiEnv: 'staging' })
  assert.equal(P.partnerForHost('staging.example.com'), null)
  assert.equal(P.partnerForHost(undefined), null)
})
t('partners.ts has no browser APIs (safe for next.config.ts)', () => assert.ok(!/\bwindow\b|\bdocument\b|localStorage/.test(psrc)))
t('real registry entries are well-formed', () => {
  for (const h of JSON.parse(regJson).hosts) {
    assert.match(h.id, T.ID_RE); assert.ok(['staging', 'prod'].includes(h.apiEnv)); assert.match(h.host, /^[a-z0-9.-]+$/)
  }
})

console.log(`\n${passed} passed`)
