'use client'
import { getEnv } from '@/lib/env'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getAccessToken, clearAuth, isLoggedIn, type CxUser } from '@/lib/auth'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import { T, BRAND, FONTS } from '@/lib/theme'

const SERVICE_B_URL = typeof window !== "undefined" ? getEnv().serviceB : "http://localhost:9000"

async function authFetch(path: string, opts: RequestInit = {}) {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${SERVICE_B_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(opts.headers || {}) },
  })
  if (res.status === 401) { clearAuth(); window.location.href = '/login'; throw new Error('Session expired') }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `Request failed (${res.status})`) }
  return res.json()
}

const ROLES = [
  { key: 'tenant_admin', label: 'Admin', color: BRAND.teal, desc: 'Full control — invite users, manage roles, configure IVRs, view audit logs' },
  { key: 'analyst', label: 'Tester', color: BRAND.blue, desc: 'Make test calls, leave feedback, rate calls, view own sessions' },
  { key: 'viewer', label: 'Viewer', color: T.tx2, desc: 'View recordings, analytics, sessions (read-only)' },
]
const ROLE_COLOR: Record<string, string> = { super_admin: '#f5a623', tenant_admin: BRAND.teal, customer_admin: BRAND.teal, analyst: BRAND.blue, viewer: T.tx2 }
const ROLE_LABEL: Record<string, string> = { super_admin: 'Super Admin', tenant_admin: 'Admin', customer_admin: 'Admin', analyst: 'Tester', viewer: 'Viewer' }

interface TeamMember { id: number; email: string; full_name: string; role: string; is_active: boolean; region_code: string | null; ivr_keys: string[]; allowed_stages: string[]; last_login_at: string | null; created_at: string }
interface AuditEntry { id: number; user_email: string; action: string; detail: string; ip_address: string | null; created_at: string }
type SideTab = 'members' | 'activity' | 'permissions'

export default function SettingsTeamPage() {
  const router = useRouter()
  const [user, setUser] = useState<CxUser | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sideTab, setSideTab] = useState<SideTab>('members')
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [invEmail, setInvEmail] = useState('')
  const [invName, setInvName] = useState('')
  const [invRole, setInvRole] = useState('viewer')
  const [invRegion, setInvRegion] = useState('')
  const [invIvrKeys, setInvIvrKeys] = useState('')
  const [invPassword, setInvPassword] = useState('')
  const [invSaving, setInvSaving] = useState(false)
  const [invMsg, setInvMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editIvrKeys, setEditIvrKeys] = useState('')
  const [editStages, setEditStages] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editMsg, setEditMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null)
  const [removing, setRemoving] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const u = getUser()
    if (u) {
      if (u.role !== 'tenant_admin' && u.role !== 'super_admin' && u.role !== 'customer_admin') { router.replace('/dashboard'); return }
      setUser(u); fetchTeam()
    }
  }, [router])

  useEffect(() => { if (sideTab === 'activity' && auditLog.length === 0) fetchAudit() }, [sideTab])

  const fetchTeam = async () => { setLoading(true); setError(''); try { const d = await authFetch('/auth/users'); setMembers(d.users || []) } catch (e: any) { setError(e.message) } finally { setLoading(false) } }
  const fetchAudit = async () => { setAuditLoading(true); try { const d = await authFetch('/auth/audit-log'); setAuditLog(d.entries || []) } catch {} finally { setAuditLoading(false) } }
  const handleSignOut = useCallback(() => { clearAuth(); router.replace('/login') }, [router])

  const handleInvite = async () => {
    setInvMsg(null)
    if (!invEmail.trim() || !invEmail.includes('@')) { setInvMsg({ type: 'err', text: 'Enter a valid email' }); return }
    if (!invPassword || invPassword.length < 8) { setInvMsg({ type: 'err', text: 'Set a temporary password (min 8 chars)' }); return }
    setInvSaving(true)
    try {
      await authFetch('/auth/users', { method: 'POST', body: JSON.stringify({ email: invEmail.trim().toLowerCase(), password: invPassword, full_name: invName.trim() || null, role: invRole, region_code: invRegion.trim() || null, ivr_keys: invIvrKeys.trim() ? invIvrKeys.split(',').map(k => k.trim()) : [] }) })
      setInvMsg({ type: 'ok', text: `Created ${invEmail.trim()} — share the temporary password with them securely` })
      setInvEmail(''); setInvName(''); setInvRole('viewer'); setInvRegion(''); setInvIvrKeys(''); setInvPassword('')
      fetchTeam()
    } catch (e: any) { setInvMsg({ type: 'err', text: e.message }) } finally { setInvSaving(false) }
  }

  const handleEditSave = async () => {
    if (!editMember) return; setEditMsg(null); setEditSaving(true)
    try {
      await authFetch(`/auth/users/${editMember.id}`, { method: 'PATCH', body: JSON.stringify({ role: editRole, region_code: editRegion.trim() || null, ivr_keys: editIvrKeys.trim() ? editIvrKeys.split(',').map(k => k.trim()) : [], allowed_stages: editStages.trim() ? editStages.split(',').map(s => s.trim()) : [] }) })
      setEditMsg({ type: 'ok', text: 'Updated' }); fetchTeam(); setTimeout(() => setEditMember(null), 600)
    } catch (e: any) { setEditMsg({ type: 'err', text: e.message }) } finally { setEditSaving(false) }
  }

  const handleRemove = async () => {
    if (!removeMember) return; setRemoving(true)
    try { await authFetch(`/auth/users/${removeMember.id}`, { method: 'DELETE' }); fetchTeam(); setRemoveMember(null) }
    catch (e: any) { setError(e.message) } finally { setRemoving(false) }
  }

  const openEdit = (m: TeamMember) => { setEditMember(m); setEditRole(m.role); setEditRegion(m.region_code || ''); setEditIvrKeys((m.ivr_keys || []).join(', ')); setEditStages((m.allowed_stages || []).join(', ')); setEditMsg(null) }

  if (!user) return null
  const isAdmin = user.role === 'tenant_admin' || user.role === 'super_admin' || user.role === 'customer_admin'
  const isSuperAdmin = user.role === 'super_admin'
  const filtered = members.filter(m => { const q = search.toLowerCase(); return (!q || m.email.toLowerCase().includes(q) || (m.full_name || '').toLowerCase().includes(q)) && (roleFilter === 'all' || m.role === roleFilter) })
  const inputStyle = { background: T.s2, color: T.tx, border: `1px solid ${T.b2}`, fontFamily: FONTS.ui }
  const activeCt = members.filter(m => m.is_active).length
  const adminCt = members.filter(m => m.role === 'tenant_admin' || m.role === 'customer_admin').length
  const testerCt = members.filter(m => m.role === 'analyst').length
  const viewerCt = members.filter(m => m.role === 'viewer').length
  const fmt = (d: string | null) => { if (!d) return '\u2014'; const t = new Date(d); return t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: T.bg, fontFamily: FONTS.ui }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.anim-up{animation:fadeUp .3s ease-out}input:focus,select:focus{border-color:${BRAND.blue}!important;outline:none}.row-hover:hover{background:${T.s2}!important}`}</style>
      <UnifiedHeader variant="dashboard" user={user} onSignOut={handleSignOut} />
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-56 flex-shrink-0 border-r flex flex-col" style={{ background: T.s1, borderColor: T.b1 }}>
          <div className="px-4 py-4 border-b" style={{ borderColor: T.b1 }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.tx3 }}>Organization</div>
            <div className="text-[16px] font-bold mt-0.5" style={{ color: T.tx }}>{user.tenant_key?.toUpperCase()}</div>
          </div>
          <div className="px-4 py-3 border-b grid grid-cols-2 gap-2" style={{ borderColor: T.b1 }}>
            {[{ n: activeCt, l: 'Total', c: T.tx }, { n: adminCt, l: 'Admins', c: BRAND.teal }, { n: testerCt, l: 'Testers', c: BRAND.blue }, { n: viewerCt, l: 'Viewers', c: T.tx2 }].map(s => (
              <div key={s.l} className="text-center py-1.5">
                <div className="text-[16px] font-bold" style={{ color: s.c, fontFamily: FONTS.mono }}>{s.n}</div>
                <div className="text-[9px] uppercase tracking-wide" style={{ color: T.tx3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 py-2">
            {([{ key: 'members' as SideTab, label: 'Team Members', icon: '\uD83D\uDC65' }, { key: 'activity' as SideTab, label: 'Activity Log', icon: '\uD83D\uDCCB' }, { key: 'permissions' as SideTab, label: 'Access Guide', icon: '\uD83D\uDD10' }]).map(t => (
              <button key={t.key} onClick={() => setSideTab(t.key)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all"
                style={{ background: sideTab === t.key ? T.s2 : 'transparent', color: sideTab === t.key ? T.tx : T.tx3, borderLeft: sideTab === t.key ? `2px solid ${BRAND.teal}` : '2px solid transparent' }}>
                <span className="text-[13px]">{t.icon}</span><span className="text-[12px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>
          {isAdmin && <div className="px-3 py-3 border-t" style={{ borderColor: T.b1 }}>
            <button onClick={() => { setShowInvite(true); setInvMsg(null) }} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90" style={{ background: BRAND.teal, color: '#000' }}>+ Add Member</button>
          </div>}
        </div>

        {/* MAIN */}
        <div className="flex-1 overflow-auto">

          {sideTab === 'members' && <div className="anim-up">
            <div className="flex items-center gap-3 px-6 py-3 border-b sticky top-0" style={{ background: T.bg, borderColor: T.b1, zIndex: 10 }}>
              <div className="text-[14px] font-bold" style={{ color: T.tx }}>Team Members</div><div className="flex-1" />
              <div className="relative"><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email\u2026" className="pl-8 pr-3 py-1.5 rounded-lg text-[11px] w-56 transition-all" style={inputStyle} /><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: T.tx3 }}>{'\uD83D\uDD0D'}</span></div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-1.5 rounded-lg text-[11px] appearance-none cursor-pointer" style={inputStyle}>
                <option value="all">All Roles</option><option value="tenant_admin">Admins</option><option value="customer_tester">Testers</option><option value="customer_viewer">Viewers</option>{isSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
              <div className="text-[11px]" style={{ color: T.tx3 }}>{filtered.length} of {members.length}</div>
            </div>
            {error && <div className="mx-6 mt-3 px-4 py-3 rounded-lg text-[12px]" style={{ background: 'rgba(248,113,113,.08)', color: '#f87171', border: '1px solid rgba(248,113,113,.2)' }}>{error}</div>}
            {loading ? <div className="text-center py-16"><div className="text-[13px]" style={{ color: T.tx3 }}>Loading team\u2026</div></div> : (
              <div className="px-6 py-4"><div className="rounded-xl border overflow-hidden" style={{ borderColor: T.b1 }}>
                <div className="grid gap-2 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '2fr 0.9fr 0.8fr 1fr 0.8fr 0.8fr 0.7fr', background: T.s1, color: T.tx3, borderBottom: `1px solid ${T.b1}` }}>
                  <div>Member</div><div>Role</div><div>Region</div><div>IVR Access</div><div>Stage Access</div><div>Last Login</div><div className="text-right">Actions</div>
                </div>
                {filtered.map(m => { const rc = ROLE_COLOR[m.role] || T.tx3; const rl = ROLE_LABEL[m.role] || m.role.replace(/_/g, ' '); const isMe = m.id === user.id; const isS = m.role === 'super_admin'; return (
                  <div key={m.id} className="grid gap-2 px-5 py-3 items-center border-b row-hover transition-colors" style={{ gridTemplateColumns: '2fr 0.9fr 0.8fr 1fr 0.8fr 0.8fr 0.7fr', borderColor: T.b1, background: isMe ? `${BRAND.blue}04` : 'transparent' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0" style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${rc}40, ${rc}15)`, color: rc, border: `1px solid ${rc}25` }}>{(m.full_name || m.email)[0].toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold truncate flex items-center gap-1.5" style={{ color: T.tx }}>{m.full_name || 'Unnamed'}{isMe && <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{ background: `${BRAND.blue}20`, color: BRAND.blue }}>YOU</span>}{!m.is_active && <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{ background: 'rgba(248,113,113,.12)', color: '#f87171' }}>INACTIVE</span>}</div>
                        <div className="text-[10px] truncate" style={{ color: T.tx3 }}>{m.email}</div>
                        <div className="text-[9px] mt-0.5" style={{ color: T.tx3 }}>Joined {fmt(m.created_at)}</div>
                      </div>
                    </div>
                    <div><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: `${rc}12`, color: rc, border: `1px solid ${rc}20` }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: rc }} />{rl}</span></div>
                    <div className="text-[11px]" style={{ color: m.region_code ? T.tx : T.tx3, fontFamily: FONTS.mono }}>{m.region_code || 'All'}</div>
                    <div className="flex flex-wrap gap-1">{(m.ivr_keys?.length > 0) ? m.ivr_keys.map(k => <span key={k} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: T.s2, color: T.tx2, border: `1px solid ${T.b1}` }}>{k}</span>) : <span className="text-[10px]" style={{ color: T.tx3 }}>All</span>}</div>
                    <div className="flex flex-wrap gap-1">{(m.allowed_stages?.length > 0) ? m.allowed_stages.map(s => <span key={s} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: T.s2, color: T.tx2, border: `1px solid ${T.b1}` }}>{s}</span>) : <span className="text-[10px]" style={{ color: T.tx3 }}>All</span>}</div>
                    <div className="text-[10px]" style={{ color: m.last_login_at ? T.tx2 : T.tx3 }}>{m.last_login_at ? fmt(m.last_login_at) : 'Never'}</div>
                    <div className="flex items-center justify-end gap-1">{isAdmin && !isS && !isMe && (<><button onClick={() => openEdit(m)} className="px-2.5 py-1 rounded text-[10px] font-medium" style={{ color: BRAND.blue, background: `${BRAND.blue}10`, border: `1px solid ${BRAND.blue}20` }}>Edit</button><button onClick={() => setRemoveMember(m)} className="px-2.5 py-1 rounded text-[10px] font-medium" style={{ color: '#f87171', background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.15)' }}>Remove</button></>)}{(isMe || isS) && <span className="text-[9px]" style={{ color: T.tx3 }}>{'\u2014'}</span>}</div>
                  </div>
                ) })}
                {filtered.length === 0 && !loading && <div className="text-center py-12"><div className="text-[24px] mb-2">{'\uD83D\uDC65'}</div><div className="text-[13px]" style={{ color: T.tx3 }}>{search || roleFilter !== 'all' ? 'No matching members' : 'No team members yet'}</div></div>}
              </div></div>
            )}
          </div>}

          {sideTab === 'activity' && <div className="anim-up">
            <div className="flex items-center gap-3 px-6 py-3 border-b sticky top-0" style={{ background: T.bg, borderColor: T.b1, zIndex: 10 }}>
              <div className="text-[14px] font-bold" style={{ color: T.tx }}>Activity Log</div>
              <div className="text-[11px]" style={{ color: T.tx3 }}>Track all team actions</div><div className="flex-1" />
              <button onClick={fetchAudit} className="px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ color: T.tx2, background: T.s1, border: `1px solid ${T.b2}` }}>{'\u21BB'} Refresh</button>
            </div>
            <div className="px-6 py-4">
              {auditLoading && <div className="text-center py-16"><div className="text-[13px]" style={{ color: T.tx3 }}>Loading\u2026</div></div>}
              {!auditLoading && auditLog.length === 0 && <div className="rounded-xl border p-8 text-center" style={{ background: T.s1, borderColor: T.b1 }}>
                <div className="text-[28px] mb-3">{'\uD83D\uDCCB'}</div>
                <div className="text-[14px] font-semibold mb-1" style={{ color: T.tx }}>Activity logging is ready</div>
                <div className="text-[12px] max-w-md mx-auto leading-relaxed" style={{ color: T.tx3 }}>Once the audit log endpoint is built in Service B, all team actions will appear here \u2014 logins, failed attempts, role changes, invites, password changes.</div>
                <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: `${BRAND.blue}10`, color: BRAND.blue, border: `1px solid ${BRAND.blue}20` }}>{'\uD83D\uDD34'} Pre-HDFC go-live checklist item</div>
              </div>}
              {!auditLoading && auditLog.length > 0 && <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.b1 }}>
                <div className="grid gap-2 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '1fr 1.5fr 2fr 0.8fr', background: T.s1, color: T.tx3, borderBottom: `1px solid ${T.b1}` }}><div>Timestamp</div><div>User</div><div>Action</div><div>IP</div></div>
                {auditLog.map(e => <div key={e.id} className="grid gap-2 px-5 py-2.5 border-b row-hover" style={{ gridTemplateColumns: '1fr 1.5fr 2fr 0.8fr', borderColor: T.b1 }}>
                  <div className="text-[10px]" style={{ color: T.tx3, fontFamily: FONTS.mono }}>{fmt(e.created_at)}</div>
                  <div className="text-[11px] truncate" style={{ color: T.tx2 }}>{e.user_email}</div>
                  <div><span className="text-[11px]" style={{ color: T.tx }}>{e.action}</span>{e.detail && <span className="text-[10px] ml-2" style={{ color: T.tx3 }}>{e.detail}</span>}</div>
                  <div className="text-[10px]" style={{ color: T.tx3, fontFamily: FONTS.mono }}>{e.ip_address || '\u2014'}</div>
                </div>)}
              </div>}
            </div>
          </div>}

          {sideTab === 'permissions' && <div className="anim-up">
            <div className="flex items-center gap-3 px-6 py-3 border-b sticky top-0" style={{ background: T.bg, borderColor: T.b1, zIndex: 10 }}>
              <div className="text-[14px] font-bold" style={{ color: T.tx }}>Access Control Guide</div>
            </div>
            <div className="px-6 py-6">
              <div className="rounded-xl border p-6 mb-6" style={{ background: T.s1, borderColor: T.b1 }}>
                <div className="text-[14px] font-bold mb-5" style={{ color: T.tx }}>How access scoping works</div>
                <div className="flex items-center gap-3">
                  {[{ icon: '\uD83C\uDFE2', title: 'Tenant', desc: 'Organization isolation \u2014 HDFC never sees ICICI data.', color: '#f5a623' },
                    { icon: '\uD83D\uDDFA\uFE0F', title: 'Region', desc: '"west" = Mumbai/Pune only. Empty = all.', color: BRAND.blue },
                    { icon: '\uD83D\uDCDE', title: 'IVR Key', desc: '"retail" vs "credit_card". Empty = all flows.', color: BRAND.teal },
                    { icon: '\uD83D\uDCCA', title: 'Stage', desc: 'explore, pilot, prod_test, prod_live.', color: '#8b5cf6' },
                    { icon: '\uD83C\uDFAD', title: 'Role', desc: 'Admin > Tester > Viewer.', color: '#f03060' }
                  ].map((x, i) => (
                    <div key={x.title} className="flex items-center gap-2 flex-1">
                      {i > 0 && <div className="text-[14px] flex-shrink-0" style={{ color: T.tx3 }}>{'\u2192'}</div>}
                      <div className="flex-1 text-center rounded-lg p-3" style={{ background: `${x.color}08`, border: `1px solid ${x.color}15` }}>
                        <div className="text-[18px] mb-1">{x.icon}</div>
                        <div className="text-[11px] font-bold mb-0.5" style={{ color: x.color }}>{x.title}</div>
                        <div className="text-[9px] leading-relaxed" style={{ color: T.tx3 }}>{x.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.b1 }}>
                <div className="grid gap-2 px-5 py-3" style={{ gridTemplateColumns: '2.5fr 0.6fr 0.6fr 0.6fr', background: T.s1, borderBottom: `1px solid ${T.b1}` }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.tx3 }}>Permission</div>
                  <div className="text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.teal }}>Admin</div>
                  <div className="text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.blue }}>Tester</div>
                  <div className="text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.tx3 }}>Viewer</div>
                </div>
                {[
                  { a: 'View dashboard & analytics', ad: true, te: true, vi: true },
                  { a: 'Listen to call recordings', ad: true, te: true, vi: true },
                  { a: 'View session transcripts', ad: true, te: true, vi: true },
                  { a: 'Make test calls', ad: true, te: true, vi: false },
                  { a: 'Rate calls & leave feedback', ad: true, te: true, vi: false },
                  { a: 'Configure experience levels', ad: true, te: false, vi: false },
                  { a: 'Configure routing modes', ad: true, te: false, vi: false },
                  { a: 'Invite & manage team members', ad: true, te: false, vi: false },
                  { a: 'Change user roles & permissions', ad: true, te: false, vi: false },
                  { a: 'View audit log', ad: true, te: false, vi: false },
                  { a: 'Remove team members', ad: true, te: false, vi: false },
                  { a: 'Approve adaptive routing for prod', ad: true, te: false, vi: false },
                ].map((r, i) => (
                  <div key={r.a} className="grid gap-2 px-5 py-2.5 border-b items-center" style={{ gridTemplateColumns: '2.5fr 0.6fr 0.6fr 0.6fr', borderColor: T.b1, background: i % 2 === 0 ? 'transparent' : `${T.s1}80` }}>
                    <div className="text-[11px]" style={{ color: T.tx2 }}>{r.a}</div>
                    <div className="text-center text-[12px]">{r.ad ? '\u2705' : '\u2014'}</div>
                    <div className="text-center text-[12px]">{r.te ? '\u2705' : '\u2014'}</div>
                    <div className="text-center text-[12px]">{r.vi ? '\u2705' : '\u2014'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>}
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInvite && <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(4,8,18,.85)', backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease-out' }} onClick={e => { if (e.target === e.currentTarget) setShowInvite(false) }}>
        <div className="w-full max-w-lg rounded-2xl border overflow-hidden max-h-[90vh] overflow-y-auto" style={{ background: T.s1, borderColor: T.b2, boxShadow: '0 24px 80px rgba(0,0,0,.6)', animation: 'fadeUp .3s ease-out' }}>
          <div className="px-6 pt-5 pb-4 border-b sticky top-0" style={{ borderColor: T.b1, background: T.s1 }}><div className="text-[15px] font-bold" style={{ color: T.tx }}>Add Team Member</div><div className="text-[11px] mt-0.5" style={{ color: T.tx3 }}>Create login for {user.tenant_key?.toUpperCase()}</div></div>
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Email *</label><input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} placeholder="colleague@company.com" autoFocus className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /></div>
              <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Full Name</label><input type="text" value={invName} onChange={e => setInvName(e.target.value)} placeholder="Optional" className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /></div>
            </div>
            <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Temporary Password *</label><input type="text" value={invPassword} onChange={e => setInvPassword(e.target.value)} placeholder="Min 8 chars" className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /><div className="text-[9px] mt-1" style={{ color: T.tx3 }}>Share securely \u2014 they should change on first login</div></div>
            <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Role *</label>
              <div className="flex flex-col gap-2">{ROLES.map(r => <label key={r.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer" style={{ background: invRole === r.key ? `${r.color}08` : T.s2, border: `1px solid ${invRole === r.key ? r.color + '30' : T.b2}` }}><input type="radio" name="invRole" value={r.key} checked={invRole === r.key} onChange={() => setInvRole(r.key)} style={{ accentColor: r.color }} /><div><div className="text-[12px] font-semibold" style={{ color: r.color }}>{r.label}</div><div className="text-[10px]" style={{ color: T.tx3 }}>{r.desc}</div></div></label>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Region</label><input type="text" value={invRegion} onChange={e => setInvRegion(e.target.value)} placeholder="e.g. west" className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /></div>
              <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>IVR Access</label><input type="text" value={invIvrKeys} onChange={e => setInvIvrKeys(e.target.value)} placeholder="e.g. retail" className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /></div>
            </div>
            {invMsg && <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: invMsg.type === 'ok' ? `${BRAND.teal}10` : 'rgba(248,113,113,.08)', color: invMsg.type === 'ok' ? BRAND.teal : '#f87171' }}>{invMsg.text}</div>}
          </div>
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: T.b1 }}>
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-lg text-[12px]" style={{ color: T.tx2, border: `1px solid ${T.b2}` }}>Cancel</button>
            <button onClick={handleInvite} disabled={invSaving || !invEmail.trim() || invPassword.length < 8} className="px-5 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-50" style={{ background: BRAND.teal, color: '#000' }}>{invSaving ? 'Creating\u2026' : 'Create User'}</button>
          </div>
        </div>
      </div>}

      {/* EDIT MODAL */}
      {editMember && <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(4,8,18,.85)', backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease-out' }} onClick={e => { if (e.target === e.currentTarget) setEditMember(null) }}>
        <div className="w-full max-w-lg rounded-2xl border overflow-hidden" style={{ background: T.s1, borderColor: T.b2, boxShadow: '0 24px 80px rgba(0,0,0,.6)', animation: 'fadeUp .3s ease-out' }}>
          <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: T.b1 }}><div className="text-[15px] font-bold" style={{ color: T.tx }}>Edit Member</div><div className="text-[11px] mt-0.5" style={{ color: T.tx3 }}>{editMember.full_name || editMember.email}</div></div>
          <div className="px-6 py-5 flex flex-col gap-4">
            <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Role</label>
              <div className="flex flex-col gap-2">{ROLES.map(r => <label key={r.key} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer" style={{ background: editRole === r.key ? `${r.color}08` : T.s2, border: `1px solid ${editRole === r.key ? r.color + '30' : T.b2}` }}><input type="radio" name="editRole" value={r.key} checked={editRole === r.key} onChange={() => setEditRole(r.key)} style={{ accentColor: r.color }} /><div><div className="text-[12px] font-semibold" style={{ color: r.color }}>{r.label}</div><div className="text-[10px]" style={{ color: T.tx3 }}>{r.desc}</div></div></label>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Region</label><input type="text" value={editRegion} onChange={e => setEditRegion(e.target.value)} placeholder="Empty = all" className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /></div>
              <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>IVR Access</label><input type="text" value={editIvrKeys} onChange={e => setEditIvrKeys(e.target.value)} placeholder="Comma-separated" className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /></div>
            </div>
            <div><label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>Stage Access</label><input type="text" value={editStages} onChange={e => setEditStages(e.target.value)} placeholder="explore, pilot, prod_test, prod_live" className="w-full px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle} /></div>
            {editMsg && <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: editMsg.type === 'ok' ? `${BRAND.teal}10` : 'rgba(248,113,113,.08)', color: editMsg.type === 'ok' ? BRAND.teal : '#f87171' }}>{editMsg.text}</div>}
          </div>
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: T.b1 }}>
            <button onClick={() => setEditMember(null)} className="px-4 py-2 rounded-lg text-[12px]" style={{ color: T.tx2, border: `1px solid ${T.b2}` }}>Cancel</button>
            <button onClick={handleEditSave} disabled={editSaving} className="px-5 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-50" style={{ background: BRAND.blue, color: '#fff' }}>{editSaving ? 'Saving\u2026' : 'Save Changes'}</button>
          </div>
        </div>
      </div>}

      {/* REMOVE MODAL */}
      {removeMember && <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(4,8,18,.85)', backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease-out' }} onClick={e => { if (e.target === e.currentTarget) setRemoveMember(null) }}>
        <div className="w-full max-w-sm rounded-2xl border overflow-hidden" style={{ background: T.s1, borderColor: 'rgba(248,113,113,.2)', boxShadow: '0 24px 80px rgba(0,0,0,.6)', animation: 'fadeUp .3s ease-out' }}>
          <div className="px-6 py-5"><div className="text-[15px] font-bold mb-2" style={{ color: '#f87171' }}>Remove Member</div><div className="text-[12px] leading-relaxed" style={{ color: T.tx2 }}>Remove <strong style={{ color: T.tx }}>{removeMember.full_name || removeMember.email}</strong>? They lose access to all {user.tenant_key?.toUpperCase()} data immediately.</div></div>
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: T.b1 }}>
            <button onClick={() => setRemoveMember(null)} className="px-4 py-2 rounded-lg text-[12px]" style={{ color: T.tx2, border: `1px solid ${T.b2}` }}>Cancel</button>
            <button onClick={handleRemove} disabled={removing} className="px-5 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-50" style={{ background: '#f87171', color: '#fff' }}>{removing ? 'Removing\u2026' : 'Remove'}</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
