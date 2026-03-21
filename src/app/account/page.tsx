'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getAccessToken, clearAuth, isLoggedIn, type CxUser } from '@/lib/auth'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import { T, BRAND, FONTS } from '@/lib/theme'

const SERVICE_B_URL = process.env.NEXT_PUBLIC_SERVICE_B_URL || 'http://localhost:9000'

// ── Helpers ──
async function authFetch(path: string, opts: RequestInit = {}) {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${SERVICE_B_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  })
  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

// ── Role display ──
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin:    { label: 'Super Admin',    color: '#f5a623' },
  tenant_admin:   { label: 'Admin',          color: BRAND.teal },
  customer_admin: { label: 'Admin',          color: BRAND.teal },
  customer_tester:{ label: 'Tester',         color: BRAND.blue },
  customer_viewer:{ label: 'Viewer',         color: T.tx2 },
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<CxUser | null>(null)
  const [tab, setTab] = useState<'profile' | 'password' | 'danger'>('profile')

  // Profile form
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password form
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const u = getUser()
    if (u) {
      setUser(u)
      setFullName(u.full_name || '')
      setCompanyName(u.company_name || '')
    }
  }, [router])

  const handleSignOut = useCallback(() => {
    clearAuth()
    router.replace('/login')
  }, [router])

  // ── Save profile ──
  const handleSaveProfile = async () => {
    if (!fullName.trim()) { setProfileMsg({ type: 'err', text: 'Name cannot be empty' }); return }
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const updated = await authFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName.trim(), company_name: companyName.trim() }),
      })
      // Update localStorage
      const u = getUser()
      if (u) {
        u.full_name = fullName.trim()
        u.company_name = companyName.trim()
        localStorage.setItem('cx_user', JSON.stringify(u))
        setUser({ ...u })
      }
      setProfileMsg({ type: 'ok', text: 'Profile updated' })
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message })
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change password ──
  const handleChangePassword = async () => {
    setPwdMsg(null)
    if (!currentPwd) { setPwdMsg({ type: 'err', text: 'Enter your current password' }); return }
    if (newPwd.length < 8) { setPwdMsg({ type: 'err', text: 'New password must be at least 8 characters' }); return }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'err', text: 'Passwords do not match' }); return }
    if (currentPwd === newPwd) { setPwdMsg({ type: 'err', text: 'New password must be different from current' }); return }

    setPwdSaving(true)
    try {
      await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      })
      setPwdMsg({ type: 'ok', text: 'Password changed successfully' })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err: any) {
      setPwdMsg({ type: 'err', text: err.message })
    } finally {
      setPwdSaving(false)
    }
  }

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { setDeleteMsg({ type: 'err', text: 'Type DELETE to confirm' }); return }
    setDeleting(true)
    setDeleteMsg(null)
    try {
      await authFetch('/auth/account', { method: 'DELETE' })
      clearAuth()
      router.replace('/')
    } catch (err: any) {
      setDeleteMsg({ type: 'err', text: err.message })
      setDeleting(false)
    }
  }

  if (!user) return null

  const roleInfo = ROLE_LABELS[user.role] || { label: user.role.replace(/_/g, ' '), color: T.tx2 }

  const tabs = [
    { key: 'profile' as const,  label: 'Profile',         icon: '👤' },
    { key: 'password' as const, label: 'Change Password',  icon: '🔑' },
    { key: 'danger' as const,   label: 'Delete Account',   icon: '⚠️' },
  ]

  const inputStyle = {
    background: T.s2,
    color: T.tx,
    border: `1px solid ${T.b2}`,
    fontFamily: FONTS.ui,
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: T.bg, fontFamily: FONTS.ui }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .acct-card { animation: fadeUp .3s ease-out; }
        input:focus { border-color: ${BRAND.blue} !important; outline: none; }
      `}</style>

      <UnifiedHeader
        variant="dashboard"
        user={user}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* ── Page title ── */}
          <div className="mb-6">
            <h1 className="text-[20px] font-bold" style={{ color: T.tx }}>Account</h1>
            <p className="text-[12px] mt-1" style={{ color: T.tx3 }}>
              Manage your profile, password, and account settings
            </p>
          </div>

          {/* ── User summary card ── */}
          <div
            className="acct-card rounded-xl border p-5 mb-6 flex items-center gap-4"
            style={{ background: T.s1, borderColor: T.b1 }}
          >
            <div
              className="flex items-center justify-center rounded-full text-[18px] font-bold flex-shrink-0"
              style={{
                width: 48, height: 48,
                background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`,
                color: '#fff',
              }}
            >
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold truncate" style={{ color: T.tx }}>
                {user.full_name || 'Unnamed User'}
              </div>
              <div className="text-[12px] truncate" style={{ color: T.tx3 }}>{user.email}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: `${roleInfo.color}15`, color: roleInfo.color, border: `1px solid ${roleInfo.color}25` }}
              >
                {roleInfo.label}
              </span>
              {user.tenant_key && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: `${BRAND.teal}12`, color: BRAND.teal, border: `1px solid ${BRAND.teal}20` }}
                >
                  {user.tenant_key}
                </span>
              )}
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="flex gap-1 mb-6 rounded-lg p-1" style={{ background: T.s1, border: `1px solid ${T.b1}` }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium transition-all flex-1 justify-center"
                style={{
                  background: tab === t.key ? T.s2 : 'transparent',
                  color: tab === t.key ? (t.key === 'danger' ? '#f87171' : T.tx) : T.tx3,
                  border: tab === t.key ? `1px solid ${T.b2}` : '1px solid transparent',
                }}
              >
                <span className="text-[12px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════
              PROFILE TAB
              ════════════════════════════════════════════ */}
          {tab === 'profile' && (
            <div className="acct-card rounded-xl border p-6" style={{ background: T.s1, borderColor: T.b1 }}>
              <div className="text-[14px] font-semibold mb-4" style={{ color: T.tx }}>Profile Information</div>

              <div className="flex flex-col gap-4">
                {/* Full Name — editable */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-[13px] transition-all"
                    style={inputStyle}
                  />
                </div>

                {/* Company — editable */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-[13px] transition-all"
                    style={inputStyle}
                  />
                </div>

                {/* Email — read-only */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                    Email
                  </label>
                  <div
                    className="w-full px-3 py-2.5 rounded-lg text-[13px]"
                    style={{ background: T.s2, color: T.tx3, border: `1px solid ${T.b1}` }}
                  >
                    {user.email}
                    <span className="text-[9px] ml-2 opacity-60">(cannot be changed)</span>
                  </div>
                </div>

                {/* Role — read-only */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                    Role
                  </label>
                  <div
                    className="w-full px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-2"
                    style={{ background: T.s2, color: T.tx3, border: `1px solid ${T.b1}` }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: roleInfo.color }}
                    />
                    {roleInfo.label}
                    <span className="text-[9px] ml-auto opacity-60">Set by your organization admin</span>
                  </div>
                </div>

                {/* Tenant — read-only */}
                {user.tenant_key && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                      Organization
                    </label>
                    <div
                      className="w-full px-3 py-2.5 rounded-lg text-[13px]"
                      style={{ background: T.s2, color: T.tx3, border: `1px solid ${T.b1}` }}
                    >
                      {user.tenant_key.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              {/* Save button + message */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: BRAND.blue, color: '#fff' }}
                >
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
                {profileMsg && (
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: profileMsg.type === 'ok' ? BRAND.teal : '#f87171' }}
                  >
                    {profileMsg.text}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              PASSWORD TAB
              ════════════════════════════════════════════ */}
          {tab === 'password' && (
            <div className="acct-card rounded-xl border p-6" style={{ background: T.s1, borderColor: T.b1 }}>
              <div className="text-[14px] font-semibold mb-1" style={{ color: T.tx }}>Change Password</div>
              <div className="text-[11px] mb-5" style={{ color: T.tx3 }}>
                Choose a strong password with at least 8 characters
              </div>

              <div className="flex flex-col gap-4 max-w-md">
                {/* Current password */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={e => setCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2.5 pr-14 rounded-lg text-[13px] transition-all"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold"
                      style={{ background: 'none', border: 'none', color: T.tx3, cursor: 'pointer' }}
                    >
                      {showCurrentPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      className="w-full px-3 py-2.5 pr-14 rounded-lg text-[13px] transition-all"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold"
                      style={{ background: 'none', border: 'none', color: T.tx3, cursor: 'pointer' }}
                    >
                      {showNewPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {newPwd && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex gap-0.5 flex-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full"
                            style={{
                              background: newPwd.length >= i * 3
                                ? (newPwd.length >= 12 ? BRAND.teal : newPwd.length >= 8 ? '#f5a623' : '#f87171')
                                : T.b1,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px]" style={{
                        color: newPwd.length >= 12 ? BRAND.teal : newPwd.length >= 8 ? '#f5a623' : '#f87171'
                      }}>
                        {newPwd.length >= 12 ? 'Strong' : newPwd.length >= 8 ? 'Fair' : 'Too short'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2.5 rounded-lg text-[13px] transition-all"
                    style={inputStyle}
                  />
                  {confirmPwd && newPwd !== confirmPwd && (
                    <div className="text-[10px] mt-1" style={{ color: '#f87171' }}>
                      Passwords don't match
                    </div>
                  )}
                </div>
              </div>

              {/* Save button + message */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={pwdSaving}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: BRAND.blue, color: '#fff' }}
                >
                  {pwdSaving ? 'Changing…' : 'Change Password'}
                </button>
                {pwdMsg && (
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: pwdMsg.type === 'ok' ? BRAND.teal : '#f87171' }}
                  >
                    {pwdMsg.text}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              DANGER ZONE TAB
              ════════════════════════════════════════════ */}
          {tab === 'danger' && (
            <div className="acct-card rounded-xl border p-6" style={{ background: T.s1, borderColor: 'rgba(248,113,113,.2)' }}>
              <div className="text-[14px] font-semibold mb-1" style={{ color: '#f87171' }}>
                ⚠️ Delete Account
              </div>
              <div className="text-[12px] mb-5 leading-relaxed" style={{ color: T.tx2 }}>
                This action is irreversible. Your account will be deactivated with a 30-day grace period.
                During this time, you can contact support to restore your account. After 30 days, all data
                associated with your account will be permanently deleted.
              </div>

              <div
                className="rounded-lg p-4 mb-5"
                style={{ background: 'rgba(248,113,113,.05)', border: '1px solid rgba(248,113,113,.15)' }}
              >
                <div className="text-[11px] font-semibold mb-2" style={{ color: '#f87171' }}>
                  What will be deleted:
                </div>
                <div className="text-[11px] leading-relaxed" style={{ color: T.tx3 }}>
                  Your profile, saved preferences, and personal data. If you are the only admin,
                  your organization's team members will lose access. Session recordings and analytics
                  data belong to the organization and will not be deleted.
                </div>
              </div>

              <div className="max-w-sm">
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.tx3 }}>
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] font-mono tracking-wider transition-all"
                  style={{
                    ...inputStyle,
                    borderColor: deleteConfirm === 'DELETE' ? 'rgba(248,113,113,.5)' : T.b2,
                  }}
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm !== 'DELETE'}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-30"
                  style={{
                    background: deleteConfirm === 'DELETE' ? '#f87171' : T.s2,
                    color: deleteConfirm === 'DELETE' ? '#fff' : T.tx3,
                    cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Permanently Delete My Account'}
                </button>
                {deleteMsg && (
                  <span className="text-[12px] font-medium" style={{ color: '#f87171' }}>
                    {deleteMsg.text}
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
