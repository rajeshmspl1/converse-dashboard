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

export function saveAuth(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY,  tokens.access_token)
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  localStorage.setItem(USER_KEY,    JSON.stringify(tokens.user))
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
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

const SERVICE_B_URL = process.env.NEXT_PUBLIC_SERVICE_B_URL || 'http://localhost:9000'
const SERVICE_I_URL = process.env.NEXT_PUBLIC_SERVICE_I_URL || 'http://localhost:8004'

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

export async function fetchI(path: string, params?: Record<string, string | number>): Promise<any> {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')

  const url = new URL(`${SERVICE_I_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

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
