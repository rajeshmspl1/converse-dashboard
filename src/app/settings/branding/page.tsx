'use client'
// Settings → Branding (B3). Today's dark layout, shared Settings sidebar. Reads and saves only through
// the B1 endpoints (POST aliases — WAF), via the shared fetchB. Everything is rendered as text.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import SettingsSidebar from '@/components/settings/SettingsSidebar'
import { useBranding } from '@/components/branding/BrandingProvider'
import { apiErrorMessage, fetchB, fetchI, getUser, isLoggedIn, signOut, type CxUser } from '@/lib/auth'
import { fetchAssetBlobUrl } from '@/lib/branding'
import { buttonTextColor, isHex, readableAccent } from '@/lib/color'
import { isSuperAdmin } from '@/lib/roles'
import { T, BRAND, BRAND_HEX, DARK, FONTS, tint } from '@/lib/theme'
import { LIGHT, lightAccent } from '@/lib/brandTheme'
import {
  EMPTY, FONT_ALLOWLIST, IMAGE_LIMITS, LOGO_PLATES, UPLOAD_TYPES, applySuggestions, buildPatch, canEditBranding, checkColor,
  formFrom, suggestionUsable, tenantPickerLabel, validate, valuesFromAdmin, valuesFromMerged,
  type ColorKey, type Field, type FormState, type Staged, type SuggestionKey, type Values,
} from '@/lib/brandingForm'

type Scope = { type: 'partner' | 'tenant'; id: string }
type Kind = 'logo' | 'favicon'
/* eslint-disable @typescript-eslint/no-explicit-any -- admin / import API JSON */

const SUGGESTION_LABELS: Record<SuggestionKey, string> = {
  logo: 'Logo', favicon: 'Favicon', primary: 'Primary colour', accent: 'Accent colour', dark: 'Dark colour',
  hero_gradient: 'Hero gradient', heading_font: 'Heading font', body_font: 'Body font',
}
const inputStyle = { background: T.s2, color: T.tx, border: `1px solid ${T.b2}`, fontFamily: FONTS.ui }

export default function SettingsBrandingPage() {
  const router = useRouter()
  const brand = useBranding()
  const [user, setUser] = useState<CxUser | null>(null)
  const superAdmin = isSuperAdmin(user?.role)

  // super_admin pickers
  const [tenants, setTenants] = useState<{ key: string; name: string; partner: string | null }[]>([])
  const partners = useMemo(() => [...new Set(tenants.map(t => t.partner).filter((p): p is string => !!p))].sort(), [tenants])
  const [partnerNames, setPartnerNames] = useState<Record<string, string>>({})   // partner id → display name (never show the id)
  const partnerLabel = (id: string) => partnerNames[id] || 'Unnamed partner'
  const [scope, setScope] = useState<Scope | null>(null)

  // form
  const [original, setOriginal] = useState<FormState>(formFrom(EMPTY, 'tenant'))
  const [form, setForm] = useState<FormState>(formFrom(EMPTY, 'tenant'))
  const [inherited, setInherited] = useState<Values | null>(null)
  const [inheritedKnown, setInheritedKnown] = useState<Record<string, boolean>>({})
  const [staged, setStaged] = useState<Staged>({})
  const [removeAsset, setRemoveAsset] = useState<Record<Kind, boolean>>({ logo: false, favicon: false })
  const [assetPreview, setAssetPreview] = useState<Record<Kind, string | null>>({ logo: null, favicon: null })
  const [inheritedAsset, setInheritedAsset] = useState<Record<Kind, string | null>>({ logo: null, favicon: null })
  const blobs = useRef<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // import
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState('')
  const [result, setResult] = useState<any>(null)
  const [ticked, setTicked] = useState<SuggestionKey[]>([])

  const track = (u: string | null) => { if (u) blobs.current.push(u); return u }
  useEffect(() => () => { blobs.current.forEach(u => URL.revokeObjectURL(u)) }, [])

  // ── guard + initial scope ──
  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const u = getUser()
    if (!u || !canEditBranding(u.role)) { router.replace('/dashboard'); return }
    void Promise.resolve().then(() => setUser(u))
  }, [router])

  useEffect(() => {
    if (!user) return
    if (!isSuperAdmin(user.role)) { void Promise.resolve().then(() => setScope({ type: 'tenant', id: user.tenant_key })); return }
    void (async () => {
      try {
        const all = await fetchI('/api/i/provisioning/all-tenants')
        const list = await Promise.all((all.tenants || []).map(async (t: any) => {
          try { const r = await fetchB(`/admin/branding/tenant/${encodeURIComponent(t.tenant_key)}`); return { key: t.tenant_key, name: tenantPickerLabel(r.display_name, t.company_name ?? t.name, t.tenant_key), partner: r.partner_id || null } }
          catch { return null }
        }))
        const ok = list.filter(Boolean) as { key: string; name: string; partner: string | null }[]
        setTenants(ok)
        const ids = [...new Set(ok.map(t => t.partner).filter((p): p is string => !!p))]
        const names = await Promise.all(ids.map(async id => {
          try { const r = await fetchB(`/admin/branding/partner/${encodeURIComponent(id)}`); return [id, r.display_name || ''] as const } catch { return [id, ''] as const }
        }))
        setPartnerNames(Object.fromEntries(names.filter(([, n]) => n)))
        const firstPartner = ok.find(t => t.partner)?.partner
        setScope(firstPartner ? { type: 'partner', id: firstPartner } : ok[0] ? { type: 'tenant', id: ok[0].key } : null)
      } catch (e) { setMsg({ type: 'err', text: apiErrorMessage(e) }); setLoading(false) }
    })()
  }, [user])

  // ── load the selected scope ──
  const load = useCallback(async (s: Scope) => {
    setLoading(true); setMsg(null); setStaged({}); setRemoveAsset({ logo: false, favicon: false }); setResult(null)
    try {
      const r = await fetchB(`/admin/branding/${s.type}/${encodeURIComponent(s.id)}`)
      const values = valuesFromAdmin(r)
      const f = formFrom(values, s.type)
      setOriginal(f); setForm(f)
      setAssetPreview({ logo: r.logo?.url ? track(await fetchAssetBlobUrl(r.logo.url)) : null, favicon: r.favicon?.url ? track(await fetchAssetBlobUrl(r.favicon.url)) : null })
      if (s.type === 'tenant') {
        if (superAdmin) {
          if (r.partner_id) {
            const p = await fetchB(`/admin/branding/partner/${encodeURIComponent(r.partner_id)}`).catch(() => null)
            setInherited(p ? valuesFromAdmin(p) : null); setInheritedKnown(Object.fromEntries(Object.keys(f.override).map(k => [k, true])))
            setInheritedAsset({ logo: p?.logo?.url ? track(await fetchAssetBlobUrl(p.logo.url)) : null, favicon: p?.favicon?.url ? track(await fetchAssetBlobUrl(p.favicon.url)) : null })
          } else { setInherited(null); setInheritedKnown({}); setInheritedAsset({ logo: null, favicon: null }) }
        } else {
          // tenant_admin cannot read the partner row: merged /branding/me equals the partner value where the tenant has none
          const me = await fetchB('/branding/me').catch(() => null)
          setInherited(me?.partner_name ? valuesFromMerged(me.branding) : null)
          setInheritedKnown(Object.fromEntries(Object.entries(f.override).map(([k, set]) => [k, !set])))
          const mine = (u: string | undefined) => !!u && u.includes(`/tenant/${s.id}/`)
          setInheritedAsset({
            logo: me?.branding?.logo_url && !mine(me.branding.logo_url) ? track(await fetchAssetBlobUrl(me.branding.logo_url)) : null,
            favicon: me?.branding?.favicon_url && !mine(me.branding.favicon_url) ? track(await fetchAssetBlobUrl(me.branding.favicon_url)) : null,
          })
        }
      } else { setInherited(null); setInheritedKnown({}); setInheritedAsset({ logo: null, favicon: null }) }
    } catch (e) { setMsg({ type: 'err', text: apiErrorMessage(e) }) }
    finally { setLoading(false) }
  }, [superAdmin])

  useEffect(() => { if (scope) void Promise.resolve().then(() => load(scope)) }, [scope, load])

  const errors = useMemo(() => validate(form), [form])
  const patch = useMemo(() => buildPatch(original, form), [original, form])
  const dirty = Object.keys(patch).length > 0 || !!staged.logo || !!staged.favicon || removeAsset.logo || removeAsset.favicon
  const blocked = Object.keys(errors).length > 0
  const isTenant = scope?.type === 'tenant'

  const set = <K extends keyof Values>(k: K, v: Values[K]) => setForm(f => ({ ...f, [k]: v }))
  const setOverride = (f: Field, on: boolean) => setForm(s => {
    const next = { ...s, override: { ...s.override, [f]: on } }
    if (on && inherited) {  // switching override on starts from the inherited value
      if (f === 'gradient') { next.gradient_from ||= inherited.gradient_from; next.gradient_to ||= inherited.gradient_to }
      else if (f !== 'logo_plate' && !(next as any)[f]) (next as any)[f] = (inherited as any)[f]
    }
    return next
  })
  const shown = (f: keyof Values, field: Field): string => (!isTenant || form.override[field] ? (form as any)[f] : (inherited as any)?.[f] || '') as string

  // ── uploads (staged until Save) ──
  const pick = (kind: Kind, file: File | undefined) => {
    setMsg(null)
    if (!file) return
    const lim = IMAGE_LIMITS[kind]
    if (!UPLOAD_TYPES.includes(file.type)) { setMsg({ type: 'err', text: `${kind === 'logo' ? 'Logo' : 'Favicon'}: PNG or JPEG only` }); return }
    if (file.size > lim.maxBytes) { setMsg({ type: 'err', text: `${kind === 'logo' ? 'Logo' : 'Favicon'}: at most ${lim.maxBytes / 1024} KB` }); return }
    setStaged(s => ({ ...s, [kind]: file })); setRemoveAsset(r => ({ ...r, [kind]: false }))
    setAssetPreview(p => ({ ...p, [kind]: track(URL.createObjectURL(file)) }))
  }

  // ── import ──
  const runImport = async () => {
    if (!scope) return
    setImporting(true); setImportErr(''); setResult(null)
    try {
      const r = await fetchB('/admin/branding/import', { method: 'POST', body: JSON.stringify({ url: importUrl.trim(), scope_type: scope.type, scope_id: scope.id }) })
      setResult(r)
      setTicked((Object.keys(SUGGESTION_LABELS) as SuggestionKey[]).filter(k => suggestionUsable(k, r.suggestions?.[k])))
    } catch (e) { setImportErr(apiErrorMessage(e)) }
    finally { setImporting(false) }
  }
  const applyImport = () => {
    if (!result) return
    const { form: next, staged: st } = applySuggestions(form, result.suggestions || {}, ticked)
    setForm(next)
    if (st.logo || st.favicon) {
      setStaged(s => ({ ...s, ...st }))
      setAssetPreview(p => ({ ...p, ...(st.logo ? { logo: track(URL.createObjectURL(st.logo)) } : {}), ...(st.favicon ? { favicon: track(URL.createObjectURL(st.favicon)) } : {}) }))
    }
    setMsg({ type: 'ok', text: 'Suggestions applied to the form. Review, then Save.' })
  }

  // ── save / discard ──
  const save = async () => {
    if (!scope || blocked || !dirty) return
    setSaving(true); setMsg(null)
    const base = `/admin/branding/${scope.type}/${encodeURIComponent(scope.id)}`
    try {
      if (Object.keys(patch).length) await fetchB(base, { method: 'POST', body: JSON.stringify(patch) })
      for (const kind of ['logo', 'favicon'] as Kind[]) {
        if (staged[kind]) {
          const fd = new FormData()
          fd.append('file', staged[kind] as Blob, `${kind}.png`)
          await fetchB(`${base}/${kind}`, { method: 'POST', body: fd })
        } else if (removeAsset[kind]) {
          await fetchB(`${base}/${kind}/delete`, { method: 'POST' })
        }
      }
      await load(scope)
      brand.reload()
      setMsg({ type: 'ok', text: 'Saved. The change is recorded in the activity log.' })
    } catch (e) { setMsg({ type: 'err', text: apiErrorMessage(e) }) }
    finally { setSaving(false) }
  }
  const discard = () => { setForm(original); setStaged({}); setRemoveAsset({ logo: false, favicon: false }); setMsg(null); if (scope) void load(scope) }

  const setPartner = async (tenantKey: string, partnerId: string) => {
    setMsg(null)
    try {
      await fetchB(`/admin/tenants/${encodeURIComponent(tenantKey)}/partner`, { method: 'POST', body: JSON.stringify({ partner_id: partnerId || null }) })
      setTenants(ts => ts.map(t => t.key === tenantKey ? { ...t, partner: partnerId || null } : t))
      if (scope) await load(scope)
      setMsg({ type: 'ok', text: partnerId ? `Partner set to ${partnerId}.` : 'Partner removed.' })
    } catch (e) { setMsg({ type: 'err', text: apiErrorMessage(e) }) }
  }

  if (!user) return null

  // ── preview values (override → form, else inherited) ──
  const pv = {
    name: shown('display_name', 'display_name') || brand.displayName || 'Your organisation',
    primary: shown('primary', 'primary') || BRAND_HEX.blue, accent: shown('accent', 'accent') || BRAND_HEX.teal, dark: shown('dark', 'dark') || DARK.s1,
    theme: ((isTenant && !form.override.theme ? inherited?.theme : form.theme) || 'dark') as 'dark' | 'light',
    gFrom: shown('gradient_from', 'gradient'), gTo: shown('gradient_to', 'gradient'),
    heading: shown('heading', 'heading'), body: shown('body', 'body'),
    plate: (isTenant && !form.override.logo_plate ? inherited?.logo_plate : form.logo_plate) || 'auto',
  }
  // Accent as the header actually renders it (readable on the preview header surface), for text only.
  const pvAccentText = isHex(pv.accent) ? (pv.theme === 'light' ? lightAccent(pv.accent) : readableAccent(pv.accent, DARK.s1)) : pv.accent
  const plateOn = pv.plate !== 'none'
  const previewLogo = (assetPreview.logo && !removeAsset.logo) ? assetPreview.logo : (isTenant ? inheritedAsset.logo : null)
  const tenantName = (key: string) => tenants.find(t => t.key === key)?.name || brand.displayName || 'Tenant'
  const scopeLabel = scope ? (scope.type === 'partner' ? `Partner · ${partnerLabel(scope.id)}` : tenantName(scope.id)) : ''
  // Sidebar "Organization": the scope being edited (super admin on a partner → the platform itself).
  const sidebarName = !superAdmin ? brand.displayName : scope?.type === 'partner' ? 'AiIVRs Platform'
    : scope ? (form.override.display_name && form.display_name.trim()) || tenantName(scope.id) : null

  // ── small UI pieces ──
  const section = (title: string, children: React.ReactNode) => (
    <div className="rounded-xl border p-4 mb-4" style={{ background: T.s1, borderColor: T.b1 }}>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: T.tx3 }}>{title}</div>
      {children}
    </div>
  )
  const override = (field: Field) => !isTenant ? null : (
    <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none" style={{ color: form.override[field] ? T.tx : T.tx3 }}>
      <input type="checkbox" checked={form.override[field]} onChange={e => setOverride(field, e.target.checked)} data-testid={`override-${field}`} />
      Override
    </label>
  )
  const inheritNote = (field: Field, value: string) => !isTenant || form.override[field] ? null : (
    <div className="text-[11px] mt-1" style={{ color: T.tx3 }}>
      {inherited ? (inheritedKnown[field] ? <>Inherited from partner: <span style={{ color: T.tx2 }}>{value || '— (not set)'}</span></> : 'Partner value shown after saving') : 'No partner — AiIVRs default'}
    </div>
  )
  const err = (field: Field) => errors[field] ? <div className="text-[11px] mt-1" style={{ color: T.danger }} data-testid={`error-${field}`}>{errors[field]}</div> : null
  const badge = (kind: ColorKey | 'gradient', value: string) => {
    if (!value) return null
    const c = checkColor(kind, value)
    if (!c.ratio) return <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: tint('danger', '.12'), color: T.danger }}>invalid</span>
    return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" data-testid={`badge-${kind}`}
      style={{ background: c.ok ? tint('green', '.12') : tint('danger', '.12'), color: c.ok ? BRAND.green : T.danger }}>{c.ok ? '✓' : '✗'} {c.ratio}:1</span>
  }
  const colorRow = (k: ColorKey, label: string, hint: string) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium" style={{ color: T.tx }}>{label}</span>{override(k)}</div>
      {(!isTenant || form.override[k]) ? (
        <div className="flex items-center gap-2 flex-wrap">
          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form[k]) ? form[k] : '#000000'} onChange={e => set(k, e.target.value.toUpperCase())} className="w-9 h-8 rounded cursor-pointer" style={{ background: 'transparent', border: `1px solid ${T.b2}` }} aria-label={`${label} picker`} />
          <input type="text" value={form[k]} onChange={e => set(k, e.target.value.trim())} placeholder="#RRGGBB" maxLength={7} className="px-2 py-1.5 rounded text-[12px] w-28 font-mono" style={inputStyle} data-testid={`hex-${k}`} />
          {badge(k, form[k])}
          <span className="text-[10px]" style={{ color: T.tx3 }}>{hint}</span>
        </div>
      ) : null}
      {inheritNote(k, inherited?.[k] || '')}
      {err(k)}
    </div>
  )
  const assetRow = (kind: Kind) => {
    const lim = IMAGE_LIMITS[kind]
    const has = !!assetPreview[kind] && !removeAsset[kind]
    const inh = !has && isTenant ? inheritedAsset[kind] : null
    return (
      <div className="mb-3">
        <div className="text-[12px] font-medium mb-1" style={{ color: T.tx }}>{kind === 'logo' ? 'Logo' : 'Favicon'}</div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center justify-center rounded" style={{ background: '#FFFFFF', width: kind === 'logo' ? 120 : 40, height: 40, padding: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview */}
            {has ? <img src={assetPreview[kind] as string} alt={`${kind} preview`} style={{ maxHeight: 32, maxWidth: '100%' }} />
              : inh ? <img src={inh} alt={`inherited ${kind}`} style={{ maxHeight: 32, maxWidth: '100%', opacity: 0.7 }} />
              : <span className="text-[10px]" style={{ color: '#6b7280' }}>none</span>}
          </div>
          <label className="px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer" style={{ color: T.tx2, background: T.s2, border: `1px solid ${T.b2}` }}>
            Upload<input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => pick(kind, e.target.files?.[0])} data-testid={`upload-${kind}`} />
          </label>
          {has && <button onClick={() => { setRemoveAsset(r => ({ ...r, [kind]: true })); setStaged(s => ({ ...s, [kind]: undefined })) }} className="text-[11px]" style={{ color: T.danger }}>Remove</button>}
          {inh && <span className="text-[10px]" style={{ color: T.tx3 }}>Inherited from partner — upload to override.</span>}
          <span className="text-[10px]" style={{ color: T.tx3 }}>PNG or JPEG, ≤ {lim.maxBytes / 1024} KB, {lim.minW}–{lim.maxW} × {lim.minH}–{lim.maxH} px{lim.square ? ', roughly square' : ''}{staged[kind] ? ' · new file, saved on Save' : ''}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: T.bg, fontFamily: FONTS.ui }}>
      <UnifiedHeader variant="dashboard" user={user} onSignOut={signOut} />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <SettingsSidebar active="branding" role={user.role} orgName={sidebarName} accent={brand.accent} />
        <div className="flex-1 overflow-auto">
          <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b sticky top-0 flex-wrap" style={{ background: T.bg, borderColor: T.b1, zIndex: 10 }}>
            <div className="text-[14px] font-bold" style={{ color: T.tx }}>Branding</div>
            {superAdmin ? (
              <label className="flex items-center gap-2 text-[11px]" style={{ color: T.tx3 }}>Editing
                <select value={scope ? `${scope.type}:${scope.id}` : ''} onChange={e => { const [t, ...id] = e.target.value.split(':'); setScope({ type: t as Scope['type'], id: id.join(':') }) }}
                  className="px-2 py-1.5 rounded text-[12px]" style={inputStyle} data-testid="scope-picker">
                  {partners.map(p => <option key={`p-${p}`} value={`partner:${p}`}>Partner · {partnerLabel(p)}</option>)}
                  {tenants.map(t => <option key={`t-${t.key}`} value={`tenant:${t.key}`}>Tenant · {t.name}</option>)}
                </select>
              </label>
            ) : <span className="text-[11px]" style={{ color: T.tx3 }} data-testid="scope-label">{scopeLabel}</span>}
            {superAdmin && isTenant && scope && (
              <label className="flex items-center gap-2 text-[11px]" style={{ color: T.tx3 }}>Partner
                <select value={tenants.find(t => t.key === scope.id)?.partner || ''} onChange={e => setPartner(scope.id, e.target.value)} className="px-2 py-1.5 rounded text-[12px]" style={inputStyle} data-testid="partner-picker">
                  <option value="">None</option>
                  {partners.map(p => <option key={p} value={p}>{partnerLabel(p)}</option>)}
                </select>
              </label>
            )}
            <div className="flex-1" />
            <button onClick={discard} disabled={!dirty || saving} className="px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-40" style={{ color: T.tx2, background: T.s1, border: `1px solid ${T.b2}` }}>Discard</button>
            <button onClick={save} disabled={!dirty || blocked || saving} className="px-4 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40" style={{ background: brand.accent, color: brand.onAccent }} data-testid="save-branding">{saving ? 'Saving…' : 'Save'}</button>
          </div>

          {msg && <div className="mx-4 md:mx-6 mt-3 px-4 py-2.5 rounded-lg text-[12px]" data-testid="branding-msg"
            style={msg.type === 'ok' ? { background: tint('green', '.08'), color: BRAND.green, border: `1px solid ${tint('green', '.2')}` } : { background: tint('danger', '.08'), color: T.danger, border: `1px solid ${tint('danger', '.2')}` }}>{msg.text}</div>}
          {blocked && <div className="mx-4 md:mx-6 mt-3 text-[11px]" style={{ color: T.danger }} data-testid="save-blocked">Fix the highlighted values to save.</div>}

          {loading ? <div className="text-center py-16 text-[13px]" style={{ color: T.tx3 }}>Loading…</div> : (
            <div className="px-4 md:px-6 py-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                {section('Import from website', <>
                  <div className="flex gap-2 flex-wrap">
                    <input type="url" value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://www.example.com" className="flex-1 min-w-0 px-3 py-2 rounded text-[12px]" style={inputStyle} data-testid="import-url" />
                    <button onClick={runImport} disabled={importing || !importUrl.trim()} className="px-3 py-2 rounded text-[12px] font-medium disabled:opacity-40" style={{ color: T.tx, background: T.s2, border: `1px solid ${T.b2}` }} data-testid="import-run">{importing ? 'Reading the site…' : 'Find branding'}</button>
                  </div>
                  <div className="text-[10px] mt-1.5" style={{ color: T.tx3 }}>Reads one public page and suggests values. Nothing is saved until you press Save.</div>
                  {importErr && <div className="text-[12px] mt-2" style={{ color: T.danger }} data-testid="import-error">{importErr}</div>}
                  {result && (
                    <div className="mt-3" data-testid="import-results">
                      {(Object.keys(SUGGESTION_LABELS) as SuggestionKey[]).map(k => {
                        const s = result.suggestions?.[k]
                        if (!s) return null
                        const usable = suggestionUsable(k, s)
                        const value = k === 'hero_gradient' ? `${s.from} → ${s.to}` : k === 'logo' || k === 'favicon' ? (s.status === 'ok' ? `${s.width}×${s.height} PNG` : s.message) : s.value
                        return (
                          <label key={k} className="flex items-center gap-2 py-1 text-[12px]" style={{ color: usable ? T.tx : T.tx3 }}>
                            <input type="checkbox" disabled={!usable} checked={ticked.includes(k)} onChange={e => setTicked(t => e.target.checked ? [...t, k] : t.filter(x => x !== k))} data-testid={`tick-${k}`} />
                            <span className="w-28 flex-shrink-0">{SUGGESTION_LABELS[k]}</span>
                            {(k === 'primary' || k === 'accent' || k === 'dark') && usable && <span className="w-3 h-3 rounded-sm" style={{ background: s.value }} />}
                            <span className="font-mono">{value}</span>
                            <span className="text-[10px] truncate" style={{ color: T.tx3 }}>{s.source}</span>
                          </label>
                        )
                      })}
                      {(result.notes || []).map((n: string, i: number) => <div key={i} className="text-[10px] mt-1" style={{ color: T.tx3 }}>{n}</div>)}
                      <button onClick={applyImport} disabled={!ticked.length} className="mt-2 px-3 py-1.5 rounded text-[12px] font-medium disabled:opacity-40" style={{ background: T.s2, color: T.tx, border: `1px solid ${T.b2}` }} data-testid="import-apply">Apply to form</button>
                    </div>
                  )}
                </>)}

                {section('Identity', <>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium" style={{ color: T.tx }}>Display name</span>{override('display_name')}</div>
                    {(!isTenant || form.override.display_name) && <input type="text" value={form.display_name} onChange={e => set('display_name', e.target.value)} maxLength={80} className="w-full px-3 py-2 rounded text-[12px]" style={inputStyle} data-testid="display-name" />}
                    {inheritNote('display_name', inherited?.display_name || '')}
                    {err('display_name')}
                  </div>
                  {assetRow('logo')}
                  {assetRow('favicon')}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium" style={{ color: T.tx }}>Logo background</span>{override('logo_plate')}</div>
                    {(!isTenant || form.override.logo_plate) && (
                      <div className="flex gap-2">{LOGO_PLATES.map(p => (
                        <button key={p} onClick={() => set('logo_plate', p)} className="px-3 py-1 rounded text-[11px]" data-testid={`plate-${p}`}
                          style={{ background: form.logo_plate === p ? T.s3 : T.s2, color: form.logo_plate === p ? T.tx : T.tx3, border: `1px solid ${form.logo_plate === p ? brand.accent : T.b2}` }}>
                          {p === 'auto' ? 'Auto' : p === 'light' ? 'Light plate' : 'None'}</button>))}</div>
                    )}
                    {inheritNote('logo_plate', inherited?.logo_plate || '')}
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium" style={{ color: T.tx }}>Show name next to the logo</span>{override('show_name')}</div>
                    {(!isTenant || form.override.show_name) && (
                      <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: T.tx2 }}>
                        <input type="checkbox" checked={form.show_name === true} onChange={e => set('show_name', e.target.checked)} data-testid="show-name" />
                        Show the display name in the header next to the logo
                      </label>
                    )}
                    {inheritNote('show_name', inherited ? (inherited.show_name ? 'on' : 'off') : '')}
                  </div>
                  <div className="mb-1">
                    <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium" style={{ color: T.tx }}>Theme (logged-in pages)</span>{override('theme')}</div>
                    {(!isTenant || form.override.theme) && (
                      <select value={form.theme} onChange={e => set('theme', e.target.value as Values['theme'])} className="px-2 py-1.5 rounded text-[12px]" style={inputStyle} data-testid="theme-select">
                        <option value="">Default (dark)</option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    )}
                    {inheritNote('theme', inherited?.theme || '')}
                    {err('theme')}
                  </div>
                </>)}

                {section('Colours', <>
                  {colorRow('primary', 'Primary', 'Buttons — white text needs 4.5:1')}
                  {colorRow('accent', 'Accent', 'Highlights on the dark app — needs 3:1')}
                  {colorRow('dark', 'Dark', 'Footer — white text needs 4.5:1')}
                  <div className="mb-1">
                    <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium" style={{ color: T.tx }}>Hero gradient (top → bottom)</span>{override('gradient')}</div>
                    {(!isTenant || form.override.gradient) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {(['gradient_from', 'gradient_to'] as const).map(g => (
                          <span key={g} className="flex items-center gap-1.5">
                            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form[g]) ? form[g] : '#000000'} onChange={e => set(g, e.target.value.toUpperCase())} className="w-9 h-8 rounded cursor-pointer" style={{ background: 'transparent', border: `1px solid ${T.b2}` }} aria-label={g} />
                            <input type="text" value={form[g]} onChange={e => set(g, e.target.value.trim())} placeholder="#RRGGBB" maxLength={7} className="px-2 py-1.5 rounded text-[12px] w-24 font-mono" style={inputStyle} data-testid={`hex-${g}`} />
                            {badge('gradient', form[g])}
                          </span>
                        ))}
                        {(form.gradient_from || form.gradient_to) && <button onClick={() => setForm(f => ({ ...f, gradient_from: '', gradient_to: '' }))} className="text-[11px]" style={{ color: T.tx3 }}>Clear</button>}
                      </div>
                    )}
                    {inheritNote('gradient', inherited?.gradient_from ? `${inherited.gradient_from} → ${inherited.gradient_to}` : '')}
                    {err('gradient')}
                  </div>
                </>)}

                {section('Fonts', <>
                  {(['heading', 'body'] as const).map(k => (
                    <div key={k} className="mb-3">
                      <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium" style={{ color: T.tx }}>{k === 'heading' ? 'Heading font' : 'Body font'}</span>{override(k)}</div>
                      {(!isTenant || form.override[k]) && (
                        <select value={form[k]} onChange={e => set(k, e.target.value)} className="px-2 py-1.5 rounded text-[12px]" style={inputStyle} data-testid={`font-${k}`}>
                          <option value="">— not set —</option>
                          {FONT_ALLOWLIST.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      )}
                      {inheritNote(k, inherited?.[k] || '')}
                      {err(k)}
                    </div>
                  ))}
                </>)}
              </div>

              <div>
                <div className="lg:sticky lg:top-16">
                  {section('Live preview', <>
                    <div className="rounded-lg overflow-hidden border" style={{ borderColor: T.b1 }} data-testid="preview">
                      <div className="flex items-center gap-2 px-3" style={{ height: 44, background: pv.theme === 'light' ? LIGHT.s1 : DARK.s1, borderBottom: `1px solid ${pv.theme === 'light' ? LIGHT.b1 : DARK.b1}` }}>
                        {previewLogo
                          ? <span className="flex items-center rounded" style={plateOn ? { background: '#FFFFFF', height: 30, padding: '3px 8px' } : { height: 30 }}><img src={previewLogo} alt={pv.name} style={{ maxHeight: plateOn ? 24 : 30, maxWidth: 110 }} /></span>
                          : <span className="text-[12px] font-bold" style={{ color: pv.theme === 'light' ? LIGHT.tx : DARK.tx }}>{pv.name}</span>}
                        <span className="text-[10px] px-2 py-0.5 rounded ml-1" style={{ color: pvAccentText, border: `1px solid ${pv.accent}66`, background: `${pv.accent}1F` }}>Overview</span>
                      </div>
                      <div className="px-4 py-5" style={{ background: pv.gFrom && pv.gTo ? `linear-gradient(180deg, ${pv.gFrom}, ${pv.gTo})` : DARK.s2 }}>
                        <div className="text-[16px] font-extrabold mb-1" style={{ color: '#FFFFFF', fontFamily: pv.heading ? `'${pv.heading}', ${FONTS.ui}` : FONTS.ui }}>{pv.name}</div>
                        <div className="text-[11px] mb-3" style={{ color: '#FFFFFF', fontFamily: pv.body ? `'${pv.body}', ${FONTS.ui}` : FONTS.ui }}>Hear it on a live demo call.</div>
                        <span className="inline-block px-3 py-1.5 rounded text-[11px] font-semibold" style={{ background: pv.primary, color: buttonTextColor(pv.primary) }}>Primary button</span>
                      </div>
                      <div className="px-4 py-2.5 text-[10px]" style={{ background: pv.dark, color: '#FFFFFF' }}>{pv.name} · Powered by AiIVRs</div>
                    </div>
                    <div className="text-[10px] mt-2" style={{ color: T.tx3 }}>Fonts in the preview use the installed font when available.</div>
                  </>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
