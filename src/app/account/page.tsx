'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, isLoggedIn, signOut, fetchB, apiErrorMessage, type CxUser } from '@/lib/auth'
import { canonicalRole, roleLabel } from '@/lib/roles'
import { useBranding } from '@/components/branding/BrandingProvider'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import { T, BRAND, FONTS, tint, v, type Token } from '@/lib/theme'

// Service B calls go through the shared fetchB (token refresh, one auth client — R172).
const authFetch = (path: string, opts: RequestInit = {}) => fetchB(path, opts)

// ── Role display ──
// Role colours as theme tokens (super_admin's #f5a623 == amber) so alpha variants go through tint().
const ROLE_TOKENS: Record<string, Token> = {
  super_admin: 'amber', tenant_admin: 'teal', tester: 'blue', analyst: 'blue', viewer: 'tx2',
}
const PASSWORD_MIN = 12 // same rule as service-b /auth/change-password

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
  const [deletePwd, setDeletePwd] = useState('')
  const orgName = useBranding().displayName
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

  const handleSignOut = useCallback(() => signOut(), [])

  // ── Save profile ──
  const handleSaveProfile = async () => {
    if (!fullName.trim()) { setProfileMsg({ type: 'err', text: 'Name cannot be empty' }); return }
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      await authFetch('/auth/me/update', {
        method: 'POST',
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
    } catch (err) {
      setProfileMsg({ type: 'err', text: apiErrorMessage(err) })
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change password ──
  const handleChangePassword = async () => {
    setPwdMsg(null)
    if (!currentPwd) { setPwdMsg({ type: 'err', text: 'Enter your current password' }); return }
    if (newPwd.length < PASSWORD_MIN) { setPwdMsg({ type: 'err', text: `New password must be at least ${PASSWORD_MIN} characters` }); return }
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
    } catch (err) {
      setPwdMsg({ type: 'err', text: apiErrorMessage(err) })
    } finally {
      setPwdSaving(false)
    }
  }

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { setDeleteMsg({ type: 'err', text: 'Type DELETE to confirm' }); return }
    if (!deletePwd) { setDeleteMsg({ type: 'err', text: 'Enter your password to confirm' }); return }
    setDeleting(true)
    setDeleteMsg(null)
    try {
      await authFetch('/auth/account/delete', { method: 'POST', body: JSON.stringify({ password: deletePwd }) })
      signOut()
    } catch (err) {
      setDeleteMsg({ type: 'err', text: apiErrorMessage(err) })
      setDeleting(false)
    }
  }

  if (!user) return null

  const roleToken: Token = ROLE_TOKENS[canonicalRole(user.role)] || 'tx2'
  const roleInfo = { label: roleLabel(user.role), color: v(roleToken) }

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
                color: T.white,
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
                style={{ background: tint(roleToken, '15'), color: roleInfo.color, border: `1px solid ${tint(roleToken, '25')}` }}
              >
                {roleInfo.label}
              </span>
              {orgName && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide"
                  style={{ background: tint('teal', '12'), color: BRAND.teal, border: `1px solid ${tint('teal', '20')}` }}
                >
                  {orgName}
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
                  color: tab === t.key ? (t.key === 'danger' ? T.danger : T.tx) : T.tx3,
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
                      {orgName || '—'}
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
                  style={{ background: BRAND.blue, color: T.onBlue }}
                >
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
                {profileMsg && (
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: profileMsg.type === 'ok' ? BRAND.teal : T.danger }}
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
                Choose a strong password with at least 12 characters
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
                      placeholder="Enter new password (min 12 characters)"
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
                                ? (newPwd.length >= 16 ? BRAND.teal : newPwd.length >= PASSWORD_MIN ? T.amber : T.danger)
                                : T.b1,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px]" style={{
                        color: newPwd.length >= 16 ? BRAND.teal : newPwd.length >= PASSWORD_MIN ? T.amber : T.danger
                      }}>
                        {newPwd.length >= 16 ? 'Strong' : newPwd.length >= PASSWORD_MIN ? 'OK' : 'Too short'}
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
                    <div className="text-[10px] mt-1" style={{ color: T.danger }}>
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
                  style={{ background: BRAND.blue, color: T.onBlue }}
                >
                  {pwdSaving ? 'Changing…' : 'Change Password'}
                </button>
                {pwdMsg && (
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: pwdMsg.type === 'ok' ? BRAND.teal : T.danger }}
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
            <div className="acct-card rounded-xl border p-6" style={{ background: T.s1, borderColor: tint('danger', '.2') }}>
              <div className="text-[14px] font-semibold mb-1" style={{ color: T.danger }}>
                ⚠️ Delete Account
              </div>
              <div className="text-[12px] mb-5 leading-relaxed" style={{ color: T.tx2 }}>
                This action is irreversible. Your account will be deactivated with a 30-day grace period.
                During this time, you can contact support to restore your account. After 30 days, all data
                associated with your account will be permanently deleted.
              </div>

              <div
                className="rounded-lg p-4 mb-5"
                style={{ background: tint('danger', '.05'), border: `1px solid ${tint('danger', '.15')}` }}
              >
                <div className="text-[11px] font-semibold mb-2" style={{ color: T.danger }}>
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
                    borderColor: deleteConfirm === 'DELETE' ? tint('danger', '.5') : T.b2,
                  }}
                />
                <label className="text-[10px] font-semibold uppercase tracking-wider mt-3 mb-1.5 block" style={{ color: T.tx3 }}>
                  Your password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deletePwd}
                  onChange={e => setDeletePwd(e.target.value)}
                  placeholder="Enter your password"
                  data-testid="delete-password"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] transition-all"
                  style={inputStyle}
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || !(deleteConfirm === 'DELETE' && !!deletePwd)}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-30"
                  style={{
                    background: deleteConfirm === 'DELETE' && !!deletePwd ? T.danger : T.s2,
                    color: deleteConfirm === 'DELETE' && !!deletePwd ? T.onDanger : T.tx3,
                    cursor: deleteConfirm === 'DELETE' && !!deletePwd ? 'pointer' : 'not-allowed',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Permanently Delete My Account'}
                </button>
                {deleteMsg && (
                  <span className="text-[12px] font-medium" style={{ color: T.danger }}>
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
