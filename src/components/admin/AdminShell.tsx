// Authenticated admin shell — header + nav + content area.
// Used by all protected admin pages (dashboard, events, gallery, etc).

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin-auth'
import AdminLogoutButton from './AdminLogoutButton'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  // Phase 6 will add: Events, Gallery, Board, Content, Settings
  { href: '/directory/admin', label: 'Directory queue' },
]

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (!isAdminEmail(user.email)) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=not_authorized')
  }

  // Auto-promote to admin role if not already
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.role !== 'admin') {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">HASA Admin</h1>
          <p className="text-sm text-gray-600">Signed in as {user.email}</p>
        </div>
        <AdminLogoutButton />
      </header>

      <nav className="rounded-lg border border-gray-200 bg-white px-2 py-2 shadow-sm flex flex-wrap gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        {children}
      </section>
    </div>
  )
}
