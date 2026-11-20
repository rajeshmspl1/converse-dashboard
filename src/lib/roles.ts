// The ONE frontend mapping for role names (mirrors service-b app/roles.py LEGACY_ROLE_MAP).
// Used for display AND when sending a role (Invite, Edit), so legacy names never reach the API.

export const LEGACY_ROLE_MAP: Record<string, string> = {
  customer_admin: 'tenant_admin',
  customer_tester: 'tester',
  customer_viewer: 'viewer',
}

export function canonicalRole(role: string | null | undefined): string {
  const r = (role || '').trim()
  return LEGACY_ROLE_MAP[r] || r
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'Admin',
  tenant_manager: 'Manager',
  agent_supervisor: 'Supervisor',
  analyst: 'Tester',
  tester: 'Tester',
  viewer: 'Viewer',
}

export function roleLabel(role: string | null | undefined): string {
  const r = canonicalRole(role)
  return ROLE_LABELS[r] || r.replace(/_/g, ' ')
}

export function isAdminRole(role: string | null | undefined): boolean {
  const r = canonicalRole(role)
  return r === 'tenant_admin' || r === 'super_admin'
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return canonicalRole(role) === 'super_admin'
}
