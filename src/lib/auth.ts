const ACCESS_KEY  = 'cx_access_token'
const REFRESH_KEY = 'cx_refresh_token'
const USER_KEY    = 'cx_user'

export interface CxUser {
  id:          number
  email:       string
  full_name:   string
  tenant_key:  string
  role:        string
  region_code: string | null
  ivr_keys:    string[]
  allowed_stages: string[]
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
