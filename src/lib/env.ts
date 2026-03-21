const ENV_MAP: Record<string, { serviceB: string; serviceF: string }> = {
  'localhost':       { serviceB: 'http://127.0.0.1:9000',  serviceF: 'http://127.0.0.1:9700' },
  '20.207.65.126':   { serviceB: 'http://4.188.99.107:9000', serviceF: 'http://4.188.99.107:9700' },
  'staging.aiivrs.com': { serviceB: 'https://api-staging.aiivrs.com', serviceF: 'https://api-staging.aiivrs.com:9700' },
  'aiivrs.com':      { serviceB: 'https://api.aiivrs.com',  serviceF: 'https://api.aiivrs.com:9700' },
}

export function getEnv() {
  if (typeof window === 'undefined') return ENV_MAP['localhost']
  const host = window.location.hostname.replace('www.', '')
  return ENV_MAP[host] || ENV_MAP['localhost']
}
