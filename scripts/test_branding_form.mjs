// Settings → Branding (B3): form validation, override logic, role guard, import → form, page wiring.
// Run (Node 20): node scripts/test_branding_form.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = f => readFileSync(path.join(root, f), 'utf8')
const js = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const themeBg = /bg:\s*'(#[0-9A-Fa-f]{6})'/.exec(read('src/lib/theme.ts'))[1]
const color = js(read('src/lib/color.ts').replace("import { SURFACES } from './theme'", `const SURFACES = { bg: '${themeBg}' }`))
const roles = js(read('src/lib/roles.ts'))
const load = src => import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))
globalThis.__color = await load(color)
globalThis.__roles = await load(roles)
const F = await load(js(read('src/lib/brandingForm.ts')
  .replace("import { contrastRatio, isHex } from './color'", 'const { contrastRatio, isHex } = globalThis.__color')
  .replace("import { isAdminRole } from './roles'", 'const { isAdminRole } = globalThis.__roles')))

let passed = 0
const t = async (name, fn) => { await fn(); passed++; console.log('PASS', name) }
const blank = (scope = 'partner') => F.formFrom({ ...F.EMPTY }, scope)

await t('role guard: tenant_admin / super_admin (+ legacy customer_admin) only', () => {
  for (const r of ['tenant_admin', 'super_admin', 'customer_admin']) assert.ok(F.canEditBranding(r), r)
  for (const r of ['tester', 'viewer', 'analyst', 'customer_tester', 'customer_viewer', '', null, undefined]) assert.ok(!F.canEditBranding(r), String(r))
})
await t('colour rules = B1: primary/dark white >= 4.5, accent vs dark surface >= 3, gradient stops white >= 4.5', () => {
  assert.equal(F.checkColor('primary', '#7A4564').ratio, 7.34); assert.ok(F.checkColor('primary', '#7A4564').ok)
  assert.ok(!F.checkColor('primary', '#F54D1D').ok)                 // 3.52 < 4.5
  assert.ok(F.checkColor('accent', '#F54D1D').ok)                   // vs #080D18
  assert.ok(!F.checkColor('accent', '#310627').ok)                  // dark purple on the dark app
  assert.ok(F.checkColor('dark', '#000000').ok); assert.ok(!F.checkColor('dark', '#777777').ok)
  assert.ok(F.checkColor('gradient', '#467779').ok); assert.ok(!F.checkColor('gradient', '#5B8C8F').ok)
  assert.ok(F.checkColor('primary', '').ok, 'empty = not set')
  for (const bad of ['red', '#fff', '#12345', '7A4564', '#7A4564;x', 'url(x)']) assert.equal(F.checkColor('primary', bad).ok, false, bad)
})
await t('validate blocks Save on invalid hex, low contrast, half gradient, bad font, HTML-ish name', () => {
  const f = blank()
  Object.assign(f, { primary: '#F54D1D', accent: 'orange', dark: '#000000', gradient_from: '#634057', gradient_to: '', heading: 'Comic Sans MS', display_name: 'A <b>' })
  const e = F.validate(f)
  assert.deepEqual(Object.keys(e).sort(), ['accent', 'display_name', 'gradient', 'heading', 'primary'])
  assert.match(e.primary, /Too low: 3\.52:1/)
  assert.match(e.accent, /#RRGGBB/)
  Object.assign(f, { primary: '#7A4564', accent: '#F54D1D', gradient_to: '#5B8C8F', heading: 'Poppins', display_name: 'x'.repeat(61) })
  const e2 = F.validate(f)
  assert.deepEqual(Object.keys(e2).sort(), ['display_name', 'gradient'])
  assert.match(e2.gradient, /^Bottom: Too low/)
  Object.assign(f, { gradient_to: '#467779', display_name: '  Demo   Bank ' })
  assert.deepEqual(F.validate(f), {})
})
await t('tenant scope: fields with override off are not validated (they will be cleared)', () => {
  const f = blank('tenant')
  f.primary = '#F54D1D'
  assert.deepEqual(F.validate(f), {})
  f.override.primary = true
  assert.ok(F.validate(f).primary)
})
await t('override logic: on = tenant value set, off = cleared (null); partner scope always on', () => {
  const vals = { ...F.EMPTY, display_name: 'Demo Bank', accent: '#F54D1D', logo_plate: 'light' }
  const orig = F.formFrom(vals, 'tenant')
  assert.deepEqual(Object.entries(orig.override).filter(([, v]) => v).map(([k]) => k).sort(), ['accent', 'display_name', 'logo_plate'])
  assert.ok(Object.values(F.formFrom(F.EMPTY, 'partner').override).every(Boolean))
  const f = structuredClone(orig)
  f.override.accent = false                                // switch off → clear the tenant accent
  f.override.primary = true; f.primary = '#7a4564'          // switch on → set
  f.logo_plate = 'auto'                                     // auto → null (reset)
  assert.deepEqual(F.buildPatch(orig, f), { colors: { primary: '#7A4564', accent: null }, logo_plate: null })
  assert.deepEqual(F.buildPatch(orig, structuredClone(orig)), {}, 'no change → empty patch (Save disabled)')
})
await t('patch: only changed fields; names cleaned; gradient both-or-null; fonts', () => {
  const orig = F.formFrom({ ...F.EMPTY, display_name: 'Old', gradient_from: '#634057', gradient_to: '#467779' }, 'partner')
  const f = structuredClone(orig)
  f.display_name = '  New​  Name '; f.gradient_from = ''; f.gradient_to = ''; f.heading = 'Poppins'
  assert.deepEqual(F.buildPatch(orig, f), { display_name: 'New Name', fonts: { heading: 'Poppins' }, hero_gradient: null })
  f.gradient_from = '#000000'; f.gradient_to = '#310627'
  assert.deepEqual(F.buildPatch(orig, f).hero_gradient, { from: '#000000', to: '#310627' })
  f.display_name = '   '
  assert.equal(F.buildPatch(orig, f).display_name, null)
})
await t('load: admin row → form values; merged /branding/me → inherited values', () => {
  const v = F.valuesFromAdmin({ display_name: 'X', colors: { primary: '#7A4564' }, fonts: { body: 'Open Sans' }, hero_gradient: { from: '#634057', to: '#467779' }, logo_plate: 'light' })
  assert.deepEqual(v, { ...F.EMPTY, display_name: 'X', primary: '#7A4564', body: 'Open Sans', gradient_from: '#634057', gradient_to: '#467779', logo_plate: 'light' })
  assert.equal(F.valuesFromAdmin({ logo_plate: 'weird' }).logo_plate, 'auto')
  assert.equal(F.valuesFromMerged({ colors: { accent: '#F54D1D' } }).accent, '#F54D1D')
})
await t('import → "Apply to form": ticked + usable only, overrides switched on, images staged (nothing saved)', () => {
  const sugg = {
    primary: { value: '#7a4564', source: 'logo colours' }, accent: { value: '#F54D1D' }, dark: { value: '#000000' },
    hero_gradient: { from: '#634057', to: '#467779' }, heading_font: { value: 'Poppins' }, body_font: { value: 'Comic Sans MS' },
    logo: { status: 'ok', mime: 'image/png', data_base64: Buffer.from('\x89PNG fake').toString('base64') },
    favicon: { status: 'unsupported', message: 'favicon is SVG, please upload a PNG' },
  }
  assert.ok(!F.suggestionUsable('body_font', sugg.body_font)); assert.ok(!F.suggestionUsable('favicon', sugg.favicon))
  const start = blank('tenant')
  const { form: f, staged } = F.applySuggestions(start, sugg, ['primary', 'hero_gradient', 'heading_font', 'body_font', 'logo', 'favicon'])
  assert.equal(f.primary, '#7A4564'); assert.equal(f.accent, '', 'accent not ticked')
  assert.deepEqual([f.gradient_from, f.gradient_to, f.heading, f.body], ['#634057', '#467779', 'Poppins', ''])
  assert.ok(f.override.primary && f.override.gradient && f.override.heading && !f.override.accent && !f.override.body)
  assert.ok(staged.logo instanceof Blob && staged.logo.type === 'image/png'); assert.equal(staged.favicon, undefined)
  assert.equal(start.primary, '', 'input form not mutated')
  assert.deepEqual(Object.keys(F.buildPatch(start, f)).sort(), ['colors', 'fonts', 'hero_gradient'])
})
await t('upload limits shown = B1 IMAGE_RULES', () => {
  assert.deepEqual([F.IMAGE_LIMITS.logo.maxBytes, F.IMAGE_LIMITS.logo.maxW, F.IMAGE_LIMITS.logo.maxH], [262144, 2000, 800])
  assert.deepEqual([F.IMAGE_LIMITS.favicon.maxBytes, F.IMAGE_LIMITS.favicon.maxW], [65536, 512])
  assert.deepEqual(F.UPLOAD_TYPES, ['image/png', 'image/jpeg'])
  assert.deepEqual([...F.FONT_ALLOWLIST], ['Open Sans', 'Poppins', 'Inter', 'Roboto', 'Lato', 'Montserrat', 'Nunito', 'Source Sans 3'])
})

// ── wiring ──
const page = read('src/app/settings/branding/page.tsx'), team = read('src/app/settings/team/page.tsx')
const side = read('src/components/settings/SettingsSidebar.tsx'), hdr = read('src/components/layout/UnifiedHeader.tsx')
const prov = read('src/components/branding/BrandingProvider.tsx')
await t('page: shared fetchB only, POST aliases, import + partner endpoints, reload after save', () => {
  assert.ok(!/getAccessToken|await fetch\(/.test(page), 'one auth client (R172)')
  assert.ok(!/method: '(PUT|PATCH|DELETE)'/.test(page), 'WAF 911100: POST only')
  assert.ok(page.includes("fetchB(base, { method: 'POST', body: JSON.stringify(patch) })"))
  assert.ok(page.includes("fetchB(`${base}/${kind}`, { method: 'POST', body: fd })") && page.includes("fetchB(`${base}/${kind}/delete`, { method: 'POST' })"))
  assert.ok(page.includes("fetchB('/admin/branding/import', { method: 'POST'"))
  assert.ok(page.includes('/partner`, { method: \'POST\', body: JSON.stringify({ partner_id: partnerId || null }) })'))
  assert.ok(/await load\(scope\)\s*\n\s*brand\.reload\(\)/.test(page), 'BrandingProvider reloads after Save')
  assert.ok(!/config\.json/i.test(page + side), 'WAF 930130')
})
await t('page: role guard, Save blocked on errors, text only', () => {
  assert.ok(page.includes("if (!u || !canEditBranding(u.role)) { router.replace('/dashboard'); return }"))
  assert.ok(page.includes('disabled={!dirty || blocked || saving}'))
  assert.ok(!/dangerouslySetInnerHTML|innerHTML/.test(page + side))
  assert.ok(!/const [A-Z][A-Za-z]+ = \(/.test(page.split('return (')[0].split('// ── small UI pieces ──')[1] || ''), 'no components defined inside render (inputs would lose focus)')
})
await t('one Settings sidebar shared by Team and Branding; Branding entry for admins only', () => {
  assert.ok(team.includes('<SettingsSidebar') && page.includes('<SettingsSidebar'))
  assert.ok(!team.includes("label: 'Team Members'"), 'Team page no longer has its own copy')
  assert.ok(side.includes('canEditBranding(role)') && side.includes("router.push('/settings/branding')"))
  assert.ok(hdr.includes('data-testid="menu-branding"') && /\{isAdminRole\(user\?\.role\) && \(\s*\n\s*<button\s*\n\s*onClick=\{\(\) => \{ setUserMenu\(false\); router\.push\('\/settings\/branding'\)/.test(hdr))
})
await t('"Powered by AiIVRs" only for partner tenants (partner_name)', () => {
  assert.ok(hdr.includes('{brand.partnerName && ('))
  assert.ok(prov.includes('partnerName: b.partner_name || null'))
  assert.ok(read('src/lib/branding.ts').includes('partner_name: res?.partner_name'))
})

await t('picker label: display_name → company_name → never the raw tenant key', () => {
  assert.equal(F.tenantPickerLabel('South Indian Bank', 'tenant_4_south_india_bank_2', 'tenant_4_south_india_bank_2'), 'South Indian Bank')
  assert.equal(F.tenantPickerLabel(null, 'Demo Bank', 'sparrow_demo'), 'Demo Bank')
  assert.equal(F.tenantPickerLabel('  ', 'tenant_4_south_india_bank_2', 'tenant_4_south_india_bank_2'), 'Unnamed tenant')
  assert.equal(F.tenantPickerLabel(undefined, undefined, 'x_key'), 'Unnamed tenant')
  assert.equal(F.tenantPickerLabel('A​cme‮', null, 'k'), 'Acme')
  const page = read('src/app/settings/branding/page.tsx')
  assert.ok(page.includes('tenantPickerLabel(r.display_name, t.company_name ?? t.name, t.tenant_key)'))
  assert.doesNotMatch(page, /name: t\.name \|\| t\.tenant_key/)
})

console.log(`\n${passed} passed`)
