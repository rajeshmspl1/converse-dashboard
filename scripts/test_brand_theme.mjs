// B4 theming: --brand-* tokens with AiIVRs fallbacks, tint() registry, light token contrast, theme
// variables, pre-paint script, display-copy swap. Run (Node 20): node scripts/test_brand_theme.mjs
import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { loadLib, read } from './lib_loader.mjs'

globalThis.__libs = {
  auth: { BRANDING_CACHE_PREFIX: 'cx_branding', authFetch: async () => ({}), fetchB: async () => ({}) },
  env: { getEnv: () => ({ serviceB: '' }) },
}
const { theme: TH, color: C, brandTheme: B, branding: BR } = await loadLib(['theme', 'color', 'brandTheme', 'branding'])

let passed = 0
const t = async (name, fn) => { await fn(); passed++; console.log('PASS', name) }

// ── tokens: with no variables set, every value is exactly today's AiIVRs colour ──
await t('v() = var(--brand-x, AiIVRs dark value); names are kebab-case', () => {
  assert.equal(TH.v('tx'), 'var(--brand-tx, #DDE6F5)')
  assert.equal(TH.v('tx3Dim'), 'var(--brand-tx-3-dim, #364D6A)')
  assert.equal(TH.v('blueAlt'), 'var(--brand-blue-alt, #3D85E0)')
  assert.equal(TH.cssName('teal2'), '--brand-teal-2')
  assert.equal(TH.T.danger, 'var(--brand-danger, #f87171)')
  assert.equal(TH.HEADER.bg, 'var(--brand-header-bg, rgba(7,13,26,0.96))')
  assert.ok(TH.FONTS.ui.startsWith('var(--brand-font-body, '))
})
await t('both palette variants kept (#364D6A/#4A5F80, #3D85E0/#3370E8)', () => {
  assert.equal(TH.DARK.tx3, '#4A5F80'); assert.equal(TH.DARK.tx3Dim, '#364D6A')
  assert.equal(TH.DARK.blue, '#3370E8'); assert.equal(TH.DARK.blueAlt, '#3D85E0')
})
await t('tint() fallback is byte-for-byte the old string-built colour', () => {
  assert.equal(TH.tint('teal', '15'), 'var(--brand-teal-a15, #00C9B115)')
  assert.equal(TH.tint('blue', '04'), 'var(--brand-blue-a04, #3370E804)')
  assert.equal(TH.tint('s1', '80'), 'var(--brand-s-1-a80, #0D152680)')
  assert.equal(TH.tint('danger', '.08'), 'var(--brand-danger-ad08, rgba(248,113,113,.08))')
  assert.equal(TH.tint('green', '.12'), 'var(--brand-green-ad12, rgba(0,222,122,.12))')
  for (const [tok, a] of TH.TINTS) {
    const old = /^[0-9a-fA-F]{2}$/.test(a) ? TH.DARK[tok] + a : null
    if (old) assert.ok(TH.tint(tok, a).endsWith(`, ${old})`), `${tok} ${a}`)
  }
})
await t('tint() throws for an unregistered (token, alpha)', () => {
  assert.throws(() => TH.tint('teal', '99'), /not registered/)
})

// ── every tint() call in the source is registered (static scan) ──
const walk = d => readdirSync(d).flatMap(f => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : [] })
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const files = walk(path.join(root, 'src')).map(p => [path.relative(root, p), read(path.relative(root, p))])
const reg = new Set(TH.TINTS.map(([a, b]) => `${a}:${b}`))
await t('every tint()/alpha() call in src uses a registered alpha; literal tokens are colour tokens', () => {
  let n = 0
  for (const [f, src] of files) {
    if (f.endsWith('lib/theme.ts')) continue
    for (const m of src.matchAll(/\b(tint|alpha)\(\s*([^,()]+?|[^,]*\([^)]*\)[^,]*)\s*,\s*'([^']+)'\s*\)/g)) {
      const [, fn, tokExpr, a] = m
      assert.ok(TH.ALPHAS.includes(a), `${f}: ${fn}(…, '${a}') — alpha not in ALPHAS`)
      const lit = /^'(\w+)'$/.exec(tokExpr.trim())
      if (fn === 'tint' && lit) assert.ok(reg.has(`${lit[1]}:${a}`), `${f}: tint(${lit[1]}, ${a}) not registered`)
      n++
    }
  }
  assert.ok(n >= 300, `found ${n} tint()/alpha() calls`)
})
await t('alpha() maps a T value back to its tint; raw hex keeps the legacy string', () => {
  assert.equal(TH.alpha(TH.T.teal, '22'), TH.tint('teal', '22'))
  assert.equal(TH.alpha(TH.T_DASH.blue, '44'), 'var(--brand-blue-alt-a44, #3D85E044)')
  assert.equal(TH.alpha(TH.T_DASH.tx3, '30'), TH.tint('tx3Dim', '30'))
  assert.equal(TH.alpha('#50c878', '22'), '#50c87822')
  assert.equal(TH.alpha(TH.T.strong, '.8'), 'var(--brand-strong-ad8, rgba(255,255,255,.8))')
})
await t('merged palettes keep each page\'s exact values (R90)', () => {
  assert.equal(TH.T_DASH.blue, TH.T.blueAlt); assert.equal(TH.T_DASH.tx3, TH.T.tx3Dim)
  assert.equal(TH.T_SESSION.blue, TH.T.blueAlt); assert.equal(TH.T_SESSION.tx3, TH.T.tx3)
  for (const f of ['src/app/dashboard/page.tsx', 'src/components/dashboard/TelephonyTab.tsx', 'src/app/dashboard/session/[id]/page.tsx',
    'src/components/auth/SignUpModal.tsx', 'src/components/dashboard/MigrationLeads.tsx', 'src/app/migrate/page.tsx'])
    assert.doesNotMatch(read(f), /^const (T|colors) = \{\s*\n?\s*(teal|bg)\s*:/m, `${f}: local palette still defined`)
})
await t('no string-built ${colour}hh in files that use theme tokens (var() + "hh" is invalid CSS)', () => {
  const RAW_OK = /pv\.accent|brand\.accent/          // raw validated brand hex (Settings preview, header plate) — not tokens
  for (const [f, src] of files) {
    if (!/from '(@\/lib\/theme|\.\/theme)'/.test(src) || f.endsWith('lib/theme.ts')) continue
    src.split('\n').forEach((line, i) => {
      if (RAW_OK.test(line) || /^\s*(\/\/|\*|\/\*)/.test(line)) return
      assert.doesNotMatch(line, /\$\{[^}]+\}[0-9a-fA-F]{2}\b(?![-\w])/, `${f}:${i + 1}: string-built alpha — use alpha()/tint()`)
      assert.doesNotMatch(line, /[\w.\])]+ ?\+ ?'[0-9a-fA-F]{2}'/, `${f}:${i + 1}: colour + 'hh' — use alpha()`)
    })
  }
})
await t('no AiIVRs palette hex left in the STEP 1/2 files (outside var() fallbacks, the logo and data comparisons)', () => {
  const PALETTE = /'#(00c9b1|3370e8|f5a623|f03060|00de7a|8b5cf6|7a90b5|4a5f80|364d6a|3d85e0|dde6f5|080d18|0d1526|111d30|16243a|1c2d45|243558|f87171|22c55e|f59e0b|000|fff)'/i
  const SCOPE = ['src/app/dashboard/page.tsx', 'src/components/dashboard/TelephonyTab.tsx', 'src/components/dashboard/MigrationLeads.tsx',
    'src/app/dashboard/session/[id]/page.tsx', 'src/app/migrate/page.tsx', 'src/app/experience/page.tsx', 'src/components/call/IvrDialpad.tsx',
    'src/components/call/NudgeSystem.tsx', 'src/components/demo/PostCallBoxes.tsx', 'src/components/demo/ConversionCTA.tsx',
    'src/components/demo/InfraMigrationDemo.tsx', 'src/components/demo/PostCallCelebration.tsx', 'src/components/auth/SignUpModal.tsx',
    'src/components/homepage/FloatingIVRBar.tsx', 'src/components/homepage/HomepageSections.tsx',
    'src/components/layout/UnifiedHeader.tsx', 'src/app/account/page.tsx', 'src/app/settings/team/page.tsx', 'src/app/settings/branding/page.tsx']
  const OK = /var\(--|jConfig\?\.color === '#f03060' \? '#fff' : '#000'|#3370e8,#0ea8b8|Converse<span|background: '#FFFFFF'|'#000000'/
  for (const f of SCOPE) read(f).split('\n').forEach((line, i) => {
    if (OK.test(line)) return
    assert.doesNotMatch(line, PALETTE, `${f}:${i + 1}: raw palette colour`)
  })
})
await t('light accents stay >= 4.5:1 on their own 20% tint (badges/chips)', () => {
  const mix = (c, s, a) => '#' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * a + parseInt(s.slice(i, i + 2), 16) * (1 - a)).toString(16).padStart(2, '0')).join('')
  for (const tok of B.TEXT_TOKENS) {
    const c = B.LIGHT[tok]
    for (const s of B.LIGHT_SURFACES) assert.ok(C.contrastRatio(c, mix(c, s, B.TINT_CEILING)) >= 4.5, `${tok} ${c} on its tint over ${s}`)
  }
  for (const hex of ['#F54D1D', '#C43E17', '#00C9B1', '#FFD400']) {
    const c = B.lightAccent(hex)
    assert.ok(C.contrastRatio(c, mix(c, '#FFFFFF', B.TINT_CEILING)) >= 4.5 && C.contrastRatio(c, '#FFFFFF') >= 4.5, `${hex} → ${c}`)
  }
})
await t('no string-built colours left in the B4 Step 1 files', () => {
  const step1 = ['src/components/layout/UnifiedHeader.tsx', 'src/app/account/page.tsx', 'src/app/settings/team/page.tsx', 'src/app/settings/branding/page.tsx']
  for (const f of step1) {
    const src = read(f)
    assert.doesNotMatch(src, /\$\{(BRAND|T)\.\w+\}[0-9a-fA-F]{2}\b/, `${f}: \${token}hh`)
    assert.doesNotMatch(src, /\$\{(rc|r\.color|x\.color)\}[0-9a-fA-F]{2}/, `${f}: role colour + alpha`)
    assert.doesNotMatch(src, /\.color \+ '[0-9a-fA-F]{2}'/, `${f}: colour + 'hh'`)
    assert.doesNotMatch(src, /'#f87171'|rgba\(248,113,113/, `${f}: raw danger colour`)
    assert.doesNotMatch(src, /color-mix\(/, `${f}: color-mix()`)
  }
})

// ── light token set: every text token ≥ 4.5:1 on every light surface (computed) ──
await t('light text tokens ≥ 4.5:1 on bg/s1/s2/s3', () => {
  for (const tok of B.TEXT_TOKENS) for (const s of B.LIGHT_SURFACES) {
    const r = C.contrastRatio(B.LIGHT[tok], s)
    assert.ok(r >= 4.5, `${tok} ${B.LIGHT[tok]} on ${s} = ${r.toFixed(2)}`)
  }
  for (const [bg, fg] of [['teal', 'onTeal'], ['blue', 'onBlue'], ['danger', 'onDanger']])
    assert.ok(C.contrastRatio(B.LIGHT[bg], B.LIGHT[fg]) >= 4.5, `${fg} on ${bg}`)
  assert.ok(B.worstTextContrast({}, 'light') >= 4.5)
})
await t('readableOn adjusts a brand colour until it passes every surface', () => {
  for (const hex of ['#FFD400', '#00C9B1', '#E8590C', '#7FDBFF', '#111111']) {
    const light = C.readableOn(hex, B.LIGHT_SURFACES)
    for (const s of B.LIGHT_SURFACES) assert.ok(C.contrastRatio(light, s) >= 4.5, `${hex}→${light} on ${s}`)
    const dark = C.readableOn(hex, B.DARK_SURFACES)
    for (const s of B.DARK_SURFACES) assert.ok(C.contrastRatio(dark, s) >= 4.5, `${hex}→${dark} on ${s}`)
  }
  assert.equal(C.readableOn('#0F172A', B.LIGHT_SURFACES), '#0F172A')   // already readable → unchanged
})
await t('button text is auto white / near-black', () => {
  assert.equal(C.buttonTextColor('#1D4ED8'), C.WHITE)
  assert.equal(C.buttonTextColor('#FFD400'), C.NEAR_BLACK)
})

// ── buildThemeVars ──
const valid = vars => { for (const [k, val] of Object.entries(vars)) { assert.match(k, B.VAR_NAME_RE, k); assert.ok(B.VAR_VALUE_RE.test(val) || Object.values(B.FONT_STACKS).includes(val), `${k}=${val}`) } }
await t('unbranded / logged out → no variables (AiIVRs dark exactly)', () => {
  assert.deepEqual(B.buildThemeVars({}), {})
  assert.deepEqual(B.buildThemeVars({ colors: { dark: '#101010' } }), {})
})
await t('light theme with brand colours: all variables validated, worst text ≥ 4.5', () => {
  const vars = B.buildThemeVars({ theme: 'light', colors: { primary: '#E8590C', accent: '#FFD400' }, fonts: { body: 'Poppins' } })
  valid(vars)
  assert.ok(B.worstTextContrast(vars, 'light') >= 4.5)
  assert.equal(vars['--brand-font-body'], B.FONT_STACKS.Poppins)
  assert.ok(vars['--brand-teal-a15'].startsWith('rgba('))
  for (const [tok, a] of TH.TINTS) if (C.isHex(B.LIGHT[tok]) || tok === 'teal' || tok === 'blue') assert.ok(TH.tintName(tok, a) in vars, `${tok} ${a}`)
})
await t('dark theme with brand colours: only changed tokens are emitted', () => {
  const vars = B.buildThemeVars({ colors: { accent: '#00C9B1' } })
  assert.ok(!('--brand-tx' in vars) && !('--brand-bg' in vars))
  valid(vars)
})
await t('malicious values never reach a variable', () => {
  const vars = B.buildThemeVars({ theme: 'light', colors: { accent: 'red;background:url(x)', primary: '#12345' }, fonts: { body: "x';}body{display:none" } })
  valid(vars)
  assert.equal(vars['--brand-teal'], B.LIGHT.teal)
  assert.ok(!('--brand-font-body' in vars))
  assert.deepEqual(B.safeVars({ '--brand-tx': 'url(x)', '--x': '#fff', '--brand-bg': '#FFFFFF', '--brand-s-1': 'expression(1)' }), { '--brand-bg': '#FFFFFF' })
})

// ── pre-paint script (fake DOM) ──
function runPrepaint({ user, token = 'x', cache }) {
  const props = {}, attrs = {}, classes = new Set(), timers = []
  const store = m => ({ getItem: k => (k in m ? m[k] : null) })
  const doc = { title: 'AiIVRs', documentElement: {
    style: { setProperty: (n, v) => { props[n] = v } },
    setAttribute: (n, v) => { attrs[n] = v },
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) } } }
  const ls = {}; if (user) ls.cx_user = JSON.stringify(user); if (token) ls.cx_access_token = token
  const ss = {}; if (cache && user) ss[B.themeCacheKey(user.id, user.tenant_key)] = typeof cache === 'string' ? cache : JSON.stringify(cache)
  vm.runInNewContext(B.PREPAINT_SCRIPT, { document: doc, localStorage: store(ls), sessionStorage: store(ss), setTimeout: (f, ms) => timers.push([f, ms]), JSON })
  return { props, attrs, classes, timers, title: doc.title }
}
await t('pre-paint: logged out → nothing touched', () => {
  const r = runPrepaint({ user: null })
  assert.deepEqual(r.props, {}); assert.equal(r.classes.size, 0); assert.equal(r.title, 'AiIVRs')
})
await t('pre-paint: logged in, no cache → hidden, unhidden after 1.5 s', () => {
  const r = runPrepaint({ user: { id: 7, tenant_key: 'tk' } })
  assert.ok(r.classes.has('brand-pending')); assert.equal(r.timers[0][1], 1500)
  r.timers[0][0](); assert.ok(!r.classes.has('brand-pending'))
})
await t('pre-paint: cached theme applied; only valid names/values; title plain text', () => {
  const vars = { '--brand-bg': '#F4F5F7', '--brand-tx': 'url(javascript:x)', '--other': '#fff', '--brand-font-body': B.FONT_STACKS.Inter, '--brand-header-bg': 'rgba(255,255,255,0.96)' }
  const r = runPrepaint({ user: { id: 7, tenant_key: 'tk' }, cache: { uid: 7, tenant: 'tk', theme: 'light', vars, title: 'Acme Bank' } })
  assert.deepEqual(r.props, { '--brand-bg': '#F4F5F7', '--brand-font-body': B.FONT_STACKS.Inter, '--brand-header-bg': 'rgba(255,255,255,0.96)' })
  assert.equal(r.attrs['data-theme'], 'light'); assert.equal(r.title, 'Acme Bank'); assert.equal(r.classes.size, 0)
  const bad = runPrepaint({ user: { id: 7, tenant_key: 'tk' }, cache: { uid: 7, theme: 'dark', vars: {}, title: '<img src=x>' } })
  assert.equal(bad.title, 'AiIVRs')
})
await t('pre-paint: another user\'s cache / corrupt cache ignored', () => {
  const other = runPrepaint({ user: { id: 7, tenant_key: 'tk' }, cache: { uid: 8, theme: 'light', vars: { '--brand-bg': '#FFFFFF' } } })
  assert.deepEqual(other.props, {}); assert.ok(!other.attrs['data-theme'])
  const corrupt = runPrepaint({ user: { id: 7, tenant_key: 'tk' }, cache: '{not json' })
  assert.deepEqual(corrupt.props, {})
})
await t('theme cache key is per user + tenant and cleared with the branding cache (R174)', () => {
  assert.equal(B.themeCacheKey(7, 'tk'), 'cx_branding_theme:7:tk')
  assert.equal(B.themeCacheKey(7, null), 'cx_branding_theme:7:-')
  assert.ok(B.THEME_CACHE_PREFIX.startsWith('cx_branding'))
  assert.ok(read('src/app/layout.tsx').includes('dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }}'))
  assert.ok(read('src/app/globals.css').includes('html.brand-pending body { visibility: hidden; }'))
})

// ── display copy for partner tenants ──
await t('brandCopy: partner tenants get their name; everyone else unchanged', () => {
  assert.equal(BR.brandCopy('Connecting to AiIVRs…', 'partner', 'Acme Bank'), 'Connecting to Acme Bank…')
  assert.equal(BR.brandCopy('Converse AI charges per intent', 'partner', 'Acme Bank'), 'Acme Bank charges per intent')
  assert.equal(BR.brandCopy('Converse-hosted cloud infrastructure', 'p', 'Acme'), 'Acme-hosted cloud infrastructure')
  assert.equal(BR.brandCopy('Connecting to AiIVRs…', null, 'J&K Bank'), 'Connecting to AiIVRs…')   // non-partner tenant
  assert.equal(BR.brandCopy('Connecting to AiIVRs…', null, null), 'Connecting to AiIVRs…')       // logged out
  assert.equal(BR.brandCopy('Conversely', 'p', 'Acme'), 'Conversely')
})
await t('display swaps wired (experience, infra demo, post-call); Service A untouched', () => {
  assert.ok(read('src/app/experience/page.tsx').includes("brandCopy('Connecting to AiIVRs…', brandCtx.partnerName, orgName)"))
  assert.ok(read('src/components/demo/InfraMigrationDemo.tsx').includes('brandCopy(s, brand.partnerName, brand.displayName)'))
  assert.ok(read('src/components/demo/PostCallCelebration.tsx').includes('brandCopy(scenario.dataResides'))
})
await t('R176 header sizes are theme tokens (56px header, 28px logo, type scale) and the header uses them', () => {
  assert.equal(TH.HEADER.height, 56); assert.equal(TH.HEADER.logoSize, 28); assert.equal(TH.HEADER.logoRadius, 8)
  assert.equal(TH.HEADER.avatar, 32); assert.equal(TH.HEADER.subLabel, 11)
  assert.equal(TH.HEADER_TEXT.nav, 'text-[13px] lg:text-[14px]'); assert.equal(TH.HEADER_TEXT.chip, 'text-[11px] px-2.5 py-1')
  const h = read('src/components/layout/UnifiedHeader.tsx')
  for (const k of Object.keys(TH.HEADER_TEXT)) assert.ok(h.includes(`HEADER_TEXT.${k}`), `header uses HEADER_TEXT.${k}`)
  assert.doesNotMatch(h, /className="[^"]*text-\[(9|10|11|12|13|14)px\][^"]*(px-|lg:text|leading-tight|font-bold flex-shrink)/, 'literal R176 size left in a header className')
  assert.doesNotMatch(h, /width: (28|32), height: (28|32)/)
})
await t('header: Zero Integration hidden for partner tenants; show_name drives the name span', () => {
  const h = read('src/components/layout/UnifiedHeader.tsx')
  assert.ok(h.includes('{!brand.partnerName && <a'))
  assert.ok(h.includes('brand.showName && brand.displayName'))
})
await t('Settings → Branding: partner ids never shown; sidebar shows the edited scope', () => {
  const p = read('src/app/settings/branding/page.tsx')
  assert.doesNotMatch(p, /Partner · \{p\}|>\{p\}<\/option>/)
  assert.ok(p.includes("partnerNames[id] || 'Unnamed partner'"))
  assert.ok(p.includes("'AiIVRs Platform'") && p.includes('orgName={sidebarName}'))
  assert.ok(p.includes('data-testid="show-name"') && p.includes('data-testid="theme-select"'))
  assert.doesNotMatch(p, /Not stored yet/)
})

console.log(`\n${passed} passed`)
