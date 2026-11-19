// Partner-host runtime config for the app pages (login, /migrate, /experience).
// On a non-partner host every helper returns today's behaviour (null config / the given fallback).
// The config file is public/partners/<id>/partner.json (never *config.json — the WAF's OWASP CRS
// rule 930130 blocks it); only the app-facing fields are read here.
import { useEffect, useState } from 'react'
import { partnerForHost } from '@/config/partners'

export interface PartnerAppConfig {
  postLogin: string | null
  demoTenantKey: string | null
  demoDisplayName: string | null
  hideReset: boolean
}

// Same-site absolute path only: "/x/y" — never "//host" (protocol-relative) or a full URL.
const PATH_RE = /^\/(?!\/)[A-Za-z0-9/_-]*$/
const TENANT_KEY_RE = /^[a-z0-9_]+$/

function str(v: unknown, re: RegExp | null, max = 80): string | null {
  return typeof v === 'string' && v.length <= max && (re ? re.test(v) : v.trim().length > 0) ? v : null
}

/** Validate the app-facing fields of a partner config (unknown/invalid values become null/false). */
export function parsePartnerAppConfig(raw: unknown): PartnerAppConfig {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    postLogin: str(c.post_login, PATH_RE),
    demoTenantKey: str(c.demo_tenant_key, TENANT_KEY_RE),
    demoDisplayName: str(c.demo_display_name, null, 60),
    hideReset: c.hide_reset === true,
  }
}

/** Partner id for the current browser host, or null (also null during SSR). */
export function currentPartnerId(): string | null {
  if (typeof window === 'undefined') return null
  return partnerForHost(window.location.hostname)?.id ?? null
}

let cached: Promise<PartnerAppConfig | null> | null = null

/** The current host's partner config; null on non-partner hosts or if it cannot be loaded. */
export function loadPartnerConfig(): Promise<PartnerAppConfig | null> {
  const id = currentPartnerId()
  if (!id) return Promise.resolve(null)
  if (!cached) {
    cached = fetch(`/partners/${id}/partner.json`, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(raw => (raw ? parsePartnerAppConfig(raw) : null))
      .catch(() => null)
  }
  return cached
}

/** Where to go after login: the partner's post_login on partner hosts, else the given fallback. */
export async function postLoginPath(fallback: string): Promise<string> {
  const cfg = await loadPartnerConfig()
  return cfg?.postLogin || fallback
}

/** Tenant label for the UI: the partner's demo display name for its demo tenant, else today's label. */
export function tenantLabel(tenantKey: string, cfg: PartnerAppConfig | null): string {
  if (cfg?.demoTenantKey && cfg.demoDisplayName && tenantKey === cfg.demoTenantKey) return cfg.demoDisplayName
  return tenantKey.replace(/_/g, ' ')
}

/** React hook: the current host's partner config (null until loaded, and on non-partner hosts). */
export function usePartnerConfig(): PartnerAppConfig | null {
  const [cfg, setCfg] = useState<PartnerAppConfig | null>(null)
  useEffect(() => {
    let live = true
    loadPartnerConfig().then(c => { if (live) setCfg(c) })
    return () => { live = false }
  }, [])
  return cfg
}
