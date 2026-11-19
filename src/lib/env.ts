import { PARTNER_HOSTS, type ApiEnv } from '@/config/partners'

type ServiceUrls = { serviceB: string; serviceF: string; serviceI: string }

const BASE_ENV_MAP: Record<string, ServiceUrls> = {
  'localhost':       { serviceB: 'http://127.0.0.1:9000',  serviceF: 'http://127.0.0.1:9700', serviceI: 'http://localhost:8004' },
  '20.207.65.126':   { serviceB: 'http://4.188.99.107:9000', serviceF: 'http://4.188.99.107:9700', serviceI: 'http://4.188.99.107:8004' },
  'staging.aiivrs.com': { serviceB: 'https://api-staging.aiivrs.com', serviceF: 'https://api-staging.aiivrs.com:9700', serviceI: 'https://api-staging.aiivrs.com' },
  'aiivrs.com':      { serviceB: 'https://api.aiivrs.com',  serviceF: 'https://api.aiivrs.com:9700', serviceI: 'https://api.aiivrs.com' },
}
// Partner hosts reuse an existing environment's service URLs (registry: src/config/partners.ts).
const API_ENV_HOST: Record<ApiEnv, string> = { staging: 'staging.aiivrs.com', prod: 'aiivrs.com' }
const ENV_MAP: Record<string, ServiceUrls> = {
  ...BASE_ENV_MAP,
  ...Object.fromEntries(Object.entries(PARTNER_HOSTS).map(([host, p]) => [host, BASE_ENV_MAP[API_ENV_HOST[p.apiEnv]]])),
}
export function getEnv() {
  if (typeof window === 'undefined') return ENV_MAP['localhost']
  const host = window.location.hostname.replace('www.', '')
  return ENV_MAP[host] || ENV_MAP['localhost']
}
