// jk_j2j4_r1 — CRM industry for the demo-profile pick (platform-level, no tenant names).
// The IVR key is NOT an industry (an uploaded bank's IVR may be called "retail"), so the
// industry comes from Service B GET /ivr/industry (read-only). global_<industry> IVRs
// resolve locally. null = unresolved → the caller must NOT fetch a profile (no pitch).

export const KNOWN_CRM_INDUSTRIES = ['banking', 'insurance', 'healthcare', 'telecom', 'ecommerce', 'hospitality'] as const

const _cache = new Map<string, string | null>()

export function industryFromIvrKey(ivrKey: string): string | null {
  const k = (ivrKey || '').trim().toLowerCase()
  if (!k.startsWith('global_')) return null
  const ind = k.slice('global_'.length)
  return (KNOWN_CRM_INDUSTRIES as readonly string[]).includes(ind) ? ind : null
}

export async function resolveCrmIndustry(
  serviceBUrl: string,
  tenantKey: string,
  ivrKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const local = industryFromIvrKey(ivrKey)
  if (local) return local
  const key = `${(tenantKey || '').toLowerCase()}|${(ivrKey || '').toLowerCase()}`
  if (_cache.has(key)) return _cache.get(key) ?? null
  try {
    const r = await fetchImpl(`${serviceBUrl}/ivr/industry?ivr_key=${encodeURIComponent(ivrKey)}`, {
      headers: { 'X-Tenant-Key': tenantKey },
    })
    if (!r.ok) return null
    const d = await r.json()
    const ind = typeof d?.industry === 'string' && d.industry ? d.industry : null
    _cache.set(key, ind)
    return ind
  } catch {
    return null // unreachable → unresolved (never guess an industry)
  }
}

export function demoProfileUrl(serviceFUrl: string, country: string, industry: string, classification?: string): string {
  const cls = classification ? `&classification=${encodeURIComponent(classification)}` : ''
  return `${serviceFUrl}/crm/demo-profile?country=${encodeURIComponent(country)}&industry=${encodeURIComponent(industry)}${cls}`
}

export function _resetCrmIndustryCache(): void { _cache.clear() }
