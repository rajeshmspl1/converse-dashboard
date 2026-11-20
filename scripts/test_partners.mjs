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
  contact_text: 'Text',
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
t('optional heading_font: validated, absent → null, bad → dropped (config still valid)', () => {
  assert.equal(T.validateConfig('p1', GOOD).heading_font, null)
  assert.equal(T.validateConfig('p1', { ...GOOD, heading_font: 'Poppins' }).heading_font, 'Poppins')
  const v = T.validateConfig('p1', { ...GOOD, heading_font: "x');@import url(evil)" })
  assert.ok(v); assert.equal(v.heading_font, null)
})
t('fonts URL: one request, encoded, deduped, invalid families skipped', () => {
  assert.equal(T.fontsUrl(['Open Sans', 'Poppins', 'Open Sans', "x');y", null]),
    'https://fonts.googleapis.com/css2?family=Open%20Sans:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&display=swap')
  assert.equal(T.fontsUrl([null, '']), null)
})
t('optional favicon: under /partners/<id>/, png/svg/ico only, bad → dropped', () => {
  assert.equal(T.validateConfig('p1', GOOD).favicon, null)
  assert.equal(T.validateConfig('p1', { ...GOOD, favicon: '/partners/p1/favicon.png' }).favicon, '/partners/p1/favicon.png')
  for (const f of ['/partners/p2/favicon.png', '/partners/p1/../favicon.png', 'https://evil/f.png', '//evil/f.png',
    '/partners/p1/favicon.html', '/partners/p1/favicon.png?x=1', 'data:image/png;base64,AA', 'javascript:alert(1)']) {
    const v = T.validateConfig('p1', { ...GOOD, favicon: f })
    assert.ok(v, f); assert.equal(v.favicon, null, f)
  }
})
t('template headings use the optional heading font, falling back to the body font', () => {
  const html = readFileSync(path.join(root, 'public/partners/template.html'), 'utf8')
  assert.ok(html.includes('h1,h2,h3{font-family:var(--fh,var(--f))}'))
})
t('optional show_name: strict boolean, default true, anything else ignored', () => {
  assert.equal(T.validateConfig('p1', GOOD).show_name, true)
  assert.equal(T.validateConfig('p1', { ...GOOD, show_name: false }).show_name, false)
  assert.equal(T.validateConfig('p1', { ...GOOD, show_name: true }).show_name, true)
  for (const v of ['false', 0, null, 'no', [], {}, 'true', 1]) {
    const c = T.validateConfig('p1', { ...GOOD, show_name: v })
    assert.ok(c, String(v)); assert.equal(c.show_name, true, JSON.stringify(v))
  }
})
t('show_name:false hides the name only when a logo is shown; logo alt = name; title unchanged', () => {
  const src = readFileSync(path.join(root, 'public/partners/template.js'), 'utf8')
  assert.ok(src.includes('logo.alt = cfg.name'))
  assert.ok(src.includes('if (name && cfg.logo && !cfg.show_name) name.hidden = true'))
  assert.ok(src.includes('document.title = cfg.name'))
})
t('footer is built from config: partner name + platform credit (no partner text in code)', () => {
  assert.equal(T.footerText(T.validateConfig('p1', GOOD)), 'P One · Powered by AiIVRs')
  assert.equal(T.validateConfig('p1', { ...GOOD, powered_by: 'Other' }).powered_by, undefined, 'free-text footer no longer read')
})
t('template a11y/contrast rules: Log in never wraps, accent CTA is large bold text, J labels use primary', () => {
  const html = readFileSync(path.join(root, 'public/partners/template.html'), 'utf8')
  assert.ok(/\.nav \.btn\{[^}]*white-space:nowrap/.test(html))
  assert.ok(/\.btn\.s\{[^}]*font-size:19px;font-weight:700/.test(html))
  assert.ok(/\.jcard \.jn\{[^}]*color:var\(--ink\)/.test(html))
})
const BAD_COLOURS = ['red;background:url(x)', 'linear-gradient(red, blue)', '#fff', 'javascript:alert(1)', '#00000', 'url(x)', null, 7, {}]
t('optional colours.dark: strict #RRGGBB with white text >= 4.5:1, else ignored (config still valid)', () => {
  assert.equal(T.validateConfig('p1', GOOD).dark, null)
  assert.equal(T.validateConfig('p1', { ...GOOD, colours: { ...GOOD.colours, dark: '#000000' } }).dark, '#000000')
  for (const d of [...BAD_COLOURS, '#F54D1D', '#FFFFFF', '#777777']) {   // last three: valid hex, contrast too low
    const v = T.validateConfig('p1', { ...GOOD, colours: { ...GOOD.colours, dark: d } })
    assert.ok(v, String(d)); assert.equal(v.dark, null, JSON.stringify(d))
  }
})
t('optional hero_gradient: both stops strict #RRGGBB and >= 4.5:1, CSS built in code, else ignored', () => {
  assert.equal(T.validateConfig('p1', GOOD).hero_gradient, null)
  const g = T.validateConfig('p1', { ...GOOD, hero_gradient: { from: '#634057', to: '#467779' } }).hero_gradient
  assert.deepEqual(g, { from: '#634057', to: '#467779' })
  assert.equal(T.gradientCss(g), 'linear-gradient(180deg, #634057, #467779)')
  const bad = [
    'linear-gradient(red, blue)', 'red;background:url(x)', 'javascript:alert(1)', ['#634057', '#467779'],
    ...BAD_COLOURS.map(c => ({ from: c, to: '#467779' })), ...BAD_COLOURS.map(c => ({ from: '#634057', to: c })),
    { from: '#634057' }, { from: '#634057', to: '#5B8C8F' },   // missing stop; low-contrast stop (3.75:1)
  ]
  for (const h of bad) {
    const v = T.validateConfig('p1', { ...GOOD, hero_gradient: h })
    assert.ok(v, JSON.stringify(h)); assert.equal(v.hero_gradient, null, JSON.stringify(h))
  }
  const src = readFileSync(path.join(root, 'public/partners/template.js'), 'utf8')
  assert.ok(!/setProperty\('--hero-bg',\s*cfg\.hero_gradient\)/.test(src), 'raw config never reaches CSS')
})
t('contrast matches B1 (WCAG 2.x): cxplab stops and dark', () => {
  const r = (a) => Math.round(T.contrastRatio(a, '#FFFFFF') * 100) / 100
  assert.equal(T.MIN_CONTRAST_TEXT, 4.5)
  assert.equal(r('#000000'), 21); assert.equal(r('#FFFFFF'), 1)
  assert.ok(r('#634057') > 8.5 && r('#634057') < 9); assert.ok(r('#467779') >= 4.5 && r('#467779') < 5.5)
})
t('optional body_font: same rules as heading_font, overrides font, bad → ignored', () => {
  assert.equal(T.validateConfig('p1', GOOD).body_font, null)
  const v = T.validateConfig('p1', { ...GOOD, font: 'Inter', body_font: 'Open Sans' })
  assert.equal(v.body_font, 'Open Sans'); assert.equal(v.font, 'Open Sans')
  const b = T.validateConfig('p1', { ...GOOD, body_font: "x');@import url(evil)" })
  assert.ok(b); assert.equal(b.body_font, null); assert.equal(b.font, 'Open Sans')
})
t('partners without the optional colours keep the default look (CSS only behind body classes)', () => {
  const html = readFileSync(path.join(root, 'public/partners/template.html'), 'utf8')
  for (const m of html.matchAll(/var\(--(hero-bg|dark)\)/g)) {
    const rule = html.slice(html.lastIndexOf('}', m.index) + 1, m.index)
    assert.ok(/\.has-(hero-bg|dark)\b/.test(rule), rule)
  }
  const v = T.validateConfig('p1', GOOD); assert.equal(v.dark, null); assert.equal(v.hero_gradient, null)
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
