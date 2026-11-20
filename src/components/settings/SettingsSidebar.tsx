'use client'
// The Settings sidebar (extracted from settings/team; used by Team and Branding — one copy).
// Desktop: a 224 px column. Below md: a horizontal strip above the page content.
import React from 'react'
import { useRouter } from 'next/navigation'
import { T, BRAND } from '@/lib/theme'
import { canEditBranding } from '@/lib/brandingForm'

export type SettingsKey = 'members' | 'activity' | 'permissions' | 'branding'

const TEAM_ITEMS: { key: SettingsKey; label: string; icon: string }[] = [
  { key: 'members', label: 'Team Members', icon: '👥' },
  { key: 'activity', label: 'Activity Log', icon: '📋' },
  { key: 'permissions', label: 'Access Guide', icon: '🔐' },
]

interface Props {
  active: SettingsKey
  role: string | null | undefined
  orgName: string | null
  accent?: string
  onTeamTab?: (key: Exclude<SettingsKey, 'branding'>) => void  // on the Team page: switch tabs in place
  stats?: React.ReactNode
  footer?: React.ReactNode
}

export default function SettingsSidebar({ active, role, orgName, accent = BRAND.teal, onTeamTab, stats, footer }: Props) {
  const router = useRouter()
  const items = canEditBranding(role) ? [...TEAM_ITEMS, { key: 'branding' as SettingsKey, label: 'Branding', icon: '🎨' }] : TEAM_ITEMS
  const go = (key: SettingsKey) => {
    if (key === 'branding') { if (active !== 'branding') router.push('/settings/branding'); return }
    if (onTeamTab) onTeamTab(key)
    else router.push(`/settings/team?tab=${key}`)
  }
  return (
    <div className="flex-shrink-0 md:w-56 border-b md:border-b-0 md:border-r flex flex-col" style={{ background: T.s1, borderColor: T.b1 }} data-testid="settings-sidebar">
      <div className="hidden md:block px-4 py-4 border-b" style={{ borderColor: T.b1 }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.tx3 }}>Organization</div>
        <div className="text-[16px] font-bold mt-0.5" style={{ color: T.tx }}>{orgName || 'Your organisation'}</div>
      </div>
      {stats && <div className="hidden md:block">{stats}</div>}
      <nav className="flex md:flex-col md:flex-1 md:py-2 overflow-x-auto">
        {items.map(t => (
          <button key={t.key} onClick={() => go(t.key)} data-testid={`settings-nav-${t.key}`}
            className="flex items-center gap-2.5 px-4 py-2.5 text-left transition-all whitespace-nowrap md:w-full"
            style={{
              background: active === t.key ? T.s2 : 'transparent', color: active === t.key ? T.tx : T.tx3,
              borderLeft: active === t.key ? `2px solid ${accent}` : '2px solid transparent',
            }}>
            <span className="text-[13px]">{t.icon}</span><span className="text-[12px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
      {footer && <div className="px-3 py-2 md:py-3 md:border-t" style={{ borderColor: T.b1 }}>{footer}</div>}
    </div>
  )
}
