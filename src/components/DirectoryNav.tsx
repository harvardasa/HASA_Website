// Sub-navigation rendered on /directory, /directory/[id], /directory/admin, /profile
// Shown BELOW HASA's main Navbar.

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default function DirectoryNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/directory'
      ? pathname === '/directory' || pathname.startsWith('/directory/') && pathname !== '/directory/admin'
      : pathname.startsWith(href)

  const linkClass = (href: string) =>
    `text-sm hover:text-gray-900 ${
      isActive(href) ? 'text-gray-900 font-semibold' : 'text-gray-600'
    }`

  return (
    <div className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/directory" className={linkClass('/directory')}>
            Directory
          </Link>
          <Link href="/profile" className={linkClass('/profile')}>
            My profile
          </Link>
          {isAdmin && (
            <Link
              href="/directory/admin"
              className={`text-sm hover:text-amber-800 ${
                pathname.startsWith('/directory/admin')
                  ? 'text-amber-800 font-semibold'
                  : 'text-amber-700'
              }`}
            >
              Admin
            </Link>
          )}
        </div>
        <LogoutButton variant="ghost" />
      </div>
    </div>
  )
}
