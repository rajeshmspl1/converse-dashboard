import { getEnv } from "./env"
const ACCESS_KEY  = 'cx_access_token'
const REFRESH_KEY = 'cx_refresh_token'
const USER_KEY    = 'cx_user'

export interface CxUser {
  id:             number
  email:          string
  full_name:      string
  tenant_key:     string
  role:           string
  region_code:    string | null
  ivr_keys:       string[]
  allowed_stages: string[]
  company_name?:  string
}

export interface AuthTokens {
  access_token:  string
  refresh_token: string
  token_type:    string
  expires_in:    number
  user:          CxUser
}

// Tenant branding cache (src/lib/branding.ts): sessionStorage keys `${BRANDING_CACHE_PREFIX}:<user id>:<tenant>`.
// Cleared on every login, logout and 401 so a new session never shows the previous tenant's brand (R174).
export const BRANDING_CACHE_PREFIX = 'cx_branding'
export const AUTH_CLEARED_EVENT = 'cx:auth-cleared'

export function clearBrandingCache(): void {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const keys: string[] = []
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i)
        if (k && k.startsWith(BRANDING_CACHE_PREFIX)) keys.push(k)
      }
      keys.forEach(k => store.removeItem(k))
    } catch { /* storage unavailable */ }
  }
  try { window.dispatchEvent(new Event(AUTH_CLEARED_EVENT)) } catch { /* no window (tests) */ }
}

export function saveAuth(tokens: AuthTokens): void {
  clearBrandingCache()
  localStorage.setItem(ACCESS_KEY,  tokens.access_token)
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  localStorage.setItem(USER_KEY,    JSON.stringify(tokens.user))
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  clearBrandingCache()
}

// Every key that holds or implies a login: tokens + user, the legacy 'access_token' key the
// dashboard still reads, and the R174 tenant/IVR/routing keys a logged-in My IVR start leaves
// in sessionStorage (which would otherwise steer the next /experience call to that tenant).
const SIGN_OUT_KEYS = [ACCESS_KEY, REFRESH_KEY, USER_KEY, 'access_token', 'cx_tenant_key', 'cx_ivr_key', 'cx_routing_mode']
/** Fixed sign-out destination. Never read from the URL (no open redirect). */
export const SIGN_OUT_DESTINATION = '/'

/**
 * The one user-initiated sign-out: clear every login key from localStorage AND sessionStorage,
 * then a full page load of "/" so the host rule serves the right home page (partner or default).
 * 401 handling is separate and unchanged: clearAuth() + /login.
 */
export function signOut(): void {
  clearAuth()
  for (const store of [localStorage, sessionStorage]) {
    for (const k of SIGN_OUT_KEYS) {
      try { store.removeItem(k) } catch { /* storage unavailable: keep going */ }
    }
  }
  window.location.assign(SIGN_OUT_DESTINATION)
}

/**
 * Back/forward cache: a logged-in page restored after sign-out still shows its old data.
 * On a persisted pageshow, re-check the login; if it is gone, go to "/". Returns a cleanup.
 */
export function guardBackForwardCache(): () => void {
  const onShow = (e: PageTransitionEvent) => {
    if (e.persisted && !isLoggedIn()) window.location.replace(SIGN_OUT_DESTINATION)
  }
  window.addEventListener('pageshow', onShow)
  return () => window.removeEventListener('pageshow', onShow)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getUser(): CxUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function isLoggedIn(): boolean {
  return !!getAccessToken() && !!getUser()
}

const SERVICE_B_URL = typeof window !== "undefined" ? getEnv().serviceB : "http://localhost:9000"
const SERVICE_I_URL = typeof window !== "undefined" ? getEnv().serviceI : "http://localhost:8004"

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${SERVICE_B_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Login failed')
  }
  const tokens: AuthTokens = await res.json()
  saveAuth(tokens)
  return tokens
}

// ══════════════════════════════════════════════════════════
// NEW: Self-Service Signup Flow
// ══════════════════════════════════════════════════════════

export interface SignupPayload {
  full_name:    string
  mobile:       string
  company_name: string
  email:        string
  source?:      string
}

export async function signup(payload: SignupPayload): Promise<{ status: string; email: string; message: string }> {
  const res = await fetch(`${SERVICE_B_URL}/auth/signup`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Signup failed')
  }
  return res.json()
}

export async function verifyOtp(email: string, otp: string): Promise<AuthTokens> {
  const res = await fetch(`${SERVICE_B_URL}/auth/verify-otp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, otp }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Verification failed')
  }
  const data = await res.json()
  // verify-otp returns tokens + user — save them
  const tokens: AuthTokens = {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    token_type:    data.token_type,
    expires_in:    data.expires_in,
    user:          data.user,
  }
  saveAuth(tokens)
  return tokens
}

export async function resendOtp(email: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${SERVICE_B_URL}/auth/resend-otp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to resend code')
  }
  return res.json()
}

/**
 * Collect all demo session IDs from sessionStorage.
 * Keys follow pattern: cvs_session_CVS-{timestamp}
 * The stored object has sessionId = LiveKit room name (e.g. hdfc__retail__1772979291191)
 */
export function collectDemoSessionIds(): string[] {
  const ids: string[] = []
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('cvs_session_')) {
        const raw = sessionStorage.getItem(key)
        if (raw) {
          const data = JSON.parse(raw)
          if (data.sessionId) ids.push(data.sessionId)
        }
      }
    }
  } catch { /* ignore */ }
  return ids
}

/**
 * Link anonymous demo sessions to the newly signed-up user.
 * Called automatically after OTP verification.
 * Fire-and-forget — if it fails, signup still works.
 */
export async function claimDemoSessions(sessionIds: string[]): Promise<{ claimed: number; skipped: number }> {
  if (!sessionIds.length) return { claimed: 0, skipped: 0 }

  const token = getAccessToken()
  if (!token) return { claimed: 0, skipped: 0 }

  try {
    const res = await fetch(`${SERVICE_B_URL}/auth/claim-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ session_ids: sessionIds }),
    })
    if (res.ok) return res.json()
  } catch { /* fire-and-forget */ }
  return { claimed: 0, skipped: 0 }
}

// ══════════════════════════════════════════════════════════
// Token refresh (R172 design). /auth/refresh returns only { access_token, expires_in, token_type }
// — no refresh token, no user, no rotation — so a refresh MERGES: only the access token is
// replaced and the stored refresh token + user stay. Never saveAuth() a refresh response.
// ══════════════════════════════════════════════════════════

let refreshInFlight: Promise<string | null> | null = null

function endSession(): null {
  clearAuth()
  window.location.href = '/login'
  return null
}

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return endSession()
  let res: Response
  try {
    res = await fetch(`${SERVICE_B_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    return null // network error: keep the session; the caller sees its original 401
  }
  if (!res.ok) return endSession()
  const data = await res.json().catch(() => null)
  if (!data || typeof data.access_token !== 'string' || !data.access_token) return endSession()
  localStorage.setItem(ACCESS_KEY, data.access_token)
  return data.access_token
}

/**
 * Refresh the access token once for every concurrent caller (shared in-flight promise).
 * Resolves to the new access token, or null — on a rejected refresh the session is cleared and
 * the page goes to /login.
 */
export function refreshAuth(): Promise<string | null> {
  if (!refreshInFlight) refreshInFlight = requestNewAccessToken().finally(() => { refreshInFlight = null })
  return refreshInFlight
}

function withBearer(init: RequestInit, token: string | null): RequestInit {
  if (!token) return init
  return { ...init, headers: { ...((init.headers as Record<string, string>) || {}), Authorization: `Bearer ${token}` } }
}

/**
 * fetch() with the stored access token. On a 401 for a request that actually SENT a token it
 * refreshes once and retries once (no loop). Logged-out requests are never refreshed or redirected.
 */
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const res = await fetch(url, withBearer(init, token))
  if (res.status !== 401 || !token) return res
  const fresh = await refreshAuth()
  return fresh ? fetch(url, withBearer(init, fresh)) : res
}

/** A short, plain-text message for a failed API call (shown to the user; never HTML). */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    let detail: unknown = null
    try { detail = JSON.parse(err.body)?.detail } catch { /* not JSON */ }
    const d = typeof detail === 'string' ? detail
      : detail && typeof detail === 'object' && typeof (detail as { error?: unknown }).error === 'string'
        ? (detail as { field?: string; error: string }).field
          ? `${(detail as { field: string }).field}: ${(detail as { error: string }).error}` : (detail as { error: string }).error
        : ''
    if (err.status === 429) return d || 'Too many attempts. Please wait and try again.'
    if (err.status === 401) return 'Your session has expired. Please sign in again.'
    if (err.status === 403) return d || 'You do not have permission to do this.'
    if (err.status === 404) return d || 'Not found.'
    if (err.status >= 500) return 'The server had a problem. Please try again.'
    return d || `Request failed (${err.status})`
  }
  if (err instanceof TypeError) return 'Could not reach the server. Check your connection and try again.'
  return err instanceof Error && err.message ? err.message : 'Something went wrong.'
}

/** Non-2xx Service B response; message is "<status>: <body>". */
export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`${status}: ${body}`)
  }
}

/** Service B JSON call with token refresh (shared by /migrate and /dashboard). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers read varied JSON shapes (same as the local fetchB it replaces)
export async function fetchB(path: string, opts: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { ...((opts.headers as Record<string, string>) || {}) }
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const res = await authFetch(`${SERVICE_B_URL}${path}`, { ...opts, headers })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json()
}

// ══════════════════════════════════════════════════════════

export async function fetchI(path: string, params?: Record<string, string | number>): Promise<any> {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')

  const url = new URL(`${SERVICE_I_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }

  const res = await authFetch(url.toString())

  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  return res.json()
}
