export function getSubdomain(hostname: string): string | null {
  // localhost:3000 → no subdomain
  // aaua-admin.uniflow.com.ng → 'aaua'
  // admin.uniflow.com.ng → 'admin' (super admin)

  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  if (isLocal) return null

  const parts = hostname.split('.')
  // aaua-admin.uniflow.com.ng has 4 parts
  if (parts.length < 4) return null

  const sub = parts[0] // e.g. 'aaua-admin'
  if (sub === 'admin') return 'super' // super admin portal
  if (sub.endsWith('-admin')) return sub.replace('-admin', '') // university short name
  return null
}

export function isUniversityPortal(hostname: string): boolean {
  const sub = getSubdomain(hostname)
  return sub !== null && sub !== 'super'
}

export function isSuperAdmin(hostname: string): boolean {
  return getSubdomain(hostname) === 'super'
}