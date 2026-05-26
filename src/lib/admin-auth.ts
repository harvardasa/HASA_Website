// CMS admin email allowlist — controls who can sign in to admin.harvardafricans.com.
// Loaded from the ADMIN_EMAIL_ALLOWLIST env var (comma-separated, no spaces).
// Comparison is case-insensitive.
//
// Defense in depth on top of password + TOTP: even if someone obtains a
// member's credentials, they cannot reach the admin subdomain unless their
// email is also listed here.

export function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminAllowlist().includes(email.toLowerCase())
}
