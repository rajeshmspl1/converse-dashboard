// Partner host registry — pure data, no browser APIs (imported by next.config.ts and env.ts).
// Single source of truth: public/partners/registry.json (also read by the partner landing page,
// which cannot see the rewritten ?p= because a rewrite keeps "/" in the browser).
import registry from '../../public/partners/registry.json'

/** Which existing API environment a partner host talks to. */
export type ApiEnv = 'staging' | 'prod'

export interface PartnerHost {
  id: string
  apiEnv: ApiEnv
}

const ID_RE = /^[a-z0-9-]+$/

function toEntry(e: { host?: unknown; id?: unknown; apiEnv?: unknown }): [string, PartnerHost] | null {
  if (typeof e.host !== 'string' || typeof e.id !== 'string' || !ID_RE.test(e.id)) return null
  if (e.apiEnv !== 'staging' && e.apiEnv !== 'prod') return null
  return [e.host.toLowerCase(), { id: e.id, apiEnv: e.apiEnv }]
}

/** host → { id, apiEnv } for every valid registry entry. */
export const PARTNER_HOSTS: Readonly<Record<string, PartnerHost>> = Object.freeze(
  Object.fromEntries((registry.hosts as Array<Record<string, unknown>>).map(toEntry).filter((x): x is [string, PartnerHost] => x !== null)),
)

/** Partner for a hostname (case-insensitive, leading "www." ignored), or null. */
export function partnerForHost(hostname: string | null | undefined): PartnerHost | null {
  const host = (hostname || '').toLowerCase().replace(/^www\./, '')
  return PARTNER_HOSTS[host] ?? null
}
