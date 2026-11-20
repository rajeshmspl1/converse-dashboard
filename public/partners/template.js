// Partner landing page (one template for every partner host).
// Partner id: the registry entry for this hostname, or a validated ?p=<id> for previews.
// Every config value is validated; text is written with textContent only (no HTML parsing).
// Any failure falls back to the default home page. Pure helpers are exported for unit tests.

export const ID_RE = /^[a-z0-9-]+$/
export const COLOUR_RE = /^#[0-9a-fA-F]{6}$/
export const FONT_RE = /^[A-Za-z0-9 ]{1,40}$/
export const FALLBACK_URL = '/preview/home-v2.html'
// J1–J4: journey index and routing mode are platform behaviour, not partner data.
export const JOURNEY_ROUTING = ['', 'sales', 'complexity', 'premium']
const COLOUR_KEYS = ['primary', 'accent', 'secondary', 'alert']
const TEXT_KEYS = ['name', 'hero_title', 'hero_subtitle', 'cta_label', 'journeys_title', 'contact_title', 'contact_text', 'powered_by']

/** Partner id for this page: registry host match first, else a ?p= value that is a registry id. */
export function resolvePartnerId(registry, hostname, search) {
  const hosts = Array.isArray(registry && registry.hosts) ? registry.hosts : []
  const ids = new Set(hosts.map(h => h && h.id).filter(id => typeof id === 'string' && ID_RE.test(id)))
  const host = String(hostname || '').toLowerCase()
  const byHost = hosts.find(h => h && h.host === host && ids.has(h.id))
  if (byHost) return byHost.id
  const p = new URLSearchParams(search || '').get('p')
  return p && ID_RE.test(p) && ids.has(p) ? p : null
}

export function isColour(v) { return typeof v === 'string' && COLOUR_RE.test(v) }

/** Logo must live under /partners/<id>/ — no other host, path or traversal. */
export function safeLogoPath(id, path) {
  const prefix = `/partners/${id}/`
  return typeof path === 'string' && path.startsWith(prefix) && !path.includes('..') && !path.includes('//')
    && /^[A-Za-z0-9/_.-]+$/.test(path) ? path : null
}

/** Optional favicon: same rule as the logo, and an image type browsers accept as a tab icon. */
export function safeFaviconPath(id, path) {
  const p = safeLogoPath(id, path)
  return p && /\.(png|svg|ico)$/i.test(p) ? p : null
}

/** Google Fonts stylesheet URL for the validated families (one request, duplicates dropped). */
export function fontsUrl(families) {
  const fams = [...new Set(families.filter(f => typeof f === 'string' && FONT_RE.test(f)))]
  if (!fams.length) return null
  return 'https://fonts.googleapis.com/css2?' + fams.map(f => `family=${encodeURIComponent(f)}:wght@400;600;700;800`).join('&') + '&display=swap'
}

function text(v, max = 400) { return typeof v === 'string' && v.trim() && v.length <= max ? v : null }

/** Validated config or null. Unknown keys are ignored; any invalid required value rejects it. */
export function validateConfig(id, cfg) {
  if (!cfg || typeof cfg !== 'object') return null
  const colours = cfg.colours || {}
  if (!COLOUR_KEYS.every(k => isColour(colours[k]))) return null
  const font = cfg.font && FONT_RE.test(cfg.font) ? cfg.font : null
  // Optional: heading_font (headings only; body keeps `font`) and favicon. Invalid → dropped, not rejected.
  const heading_font = cfg.heading_font && FONT_RE.test(cfg.heading_font) ? cfg.heading_font : null
  const logo = safeLogoPath(id, cfg.logo)
  const favicon = safeFaviconPath(id, cfg.favicon)
  const out = { id, colours: Object.fromEntries(COLOUR_KEYS.map(k => [k, colours[k]])), font, heading_font, logo, favicon }
  for (const k of TEXT_KEYS) {
    out[k] = text(cfg[k])
    if (!out[k]) return null
  }
  const journeys = Array.isArray(cfg.journeys) ? cfg.journeys : []
  if (journeys.length !== JOURNEY_ROUTING.length) return null
  out.journeys = journeys.map(j => ({ label: text(j && j.label, 60), outcome: text(j && j.outcome, 200) }))
  if (out.journeys.some(j => !j.label || !j.outcome)) return null
  return out
}

/** /experience URL for journey index n (0–3): no tenant — the public Experience Shop. */
export function journeyUrl(n) {
  const rm = JOURNEY_ROUTING[n]
  return `/experience?journey=${n}${rm ? `&routing_mode=${rm}` : ''}`
}

function el(tag, cls, value) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (value != null) e.textContent = value
  return e
}

function render(cfg) {
  const root = document.documentElement.style
  root.setProperty('--ink', cfg.colours.primary)
  root.setProperty('--sun', cfg.colours.accent)
  root.setProperty('--teal', cfg.colours.secondary)
  root.setProperty('--alert', cfg.colours.alert)
  const href = fontsUrl([cfg.font, cfg.heading_font])
  if (href) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }
  const stack = f => `'${f}',system-ui,-apple-system,'Segoe UI',Arial,sans-serif`
  if (cfg.font) root.setProperty('--f', stack(cfg.font))
  if (cfg.heading_font) root.setProperty('--fh', stack(cfg.heading_font))
  if (cfg.favicon) {
    const icon = document.createElement('link')
    icon.rel = 'icon'
    icon.href = cfg.favicon
    document.head.appendChild(icon)
  }
  document.title = cfg.name
  const set = (sel, v) => { const n = document.querySelector(sel); if (n) n.textContent = v }
  set('[data-k="name"]', cfg.name)
  set('[data-k="hero_title"]', cfg.hero_title)
  set('[data-k="hero_subtitle"]', cfg.hero_subtitle)
  set('[data-k="cta_label"]', cfg.cta_label)
  set('[data-k="journeys_title"]', cfg.journeys_title)
  set('[data-k="contact_title"]', cfg.contact_title)
  set('[data-k="contact_text"]', cfg.contact_text)
  set('[data-k="powered_by"]', cfg.powered_by)
  const logo = document.querySelector('[data-k="logo"]')
  if (logo && cfg.logo) { logo.src = cfg.logo; logo.alt = cfg.name; logo.hidden = false }
  const cta = document.querySelector('[data-k="cta_label"]')
  if (cta) cta.href = journeyUrl(0)
  const list = document.querySelector('[data-k="journeys"]')
  cfg.journeys.forEach((j, n) => {
    const a = el('a', 'jcard')
    a.href = journeyUrl(n)
    a.appendChild(el('span', 'jn', `J${n + 1}`))
    a.appendChild(el('h3', null, j.label))
    a.appendChild(el('p', null, j.outcome))
    list.appendChild(a)
  })
  document.body.hidden = false
}

async function main() {
  const fail = () => window.location.replace(FALLBACK_URL)
  try {
    const reg = await (await fetch('/partners/registry.json', { cache: 'no-cache' })).json()
    const id = resolvePartnerId(reg, window.location.hostname, window.location.search)
    if (!id) return fail()
    // partner.json, not config.json: the WAF (OWASP CRS 930130) blocks any path containing config.json
    const res = await fetch(`/partners/${id}/partner.json`, { cache: 'no-cache' })
    const cfg = res.ok ? validateConfig(id, await res.json()) : null
    return cfg ? render(cfg) : fail()
  } catch {
    return fail()
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') main()
