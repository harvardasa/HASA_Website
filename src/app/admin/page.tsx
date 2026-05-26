// Admin dashboard placeholder. Phase 6 fills this with full CMS controls.

import AdminShell from '@/components/admin/AdminShell'
import { createServerClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createServerClient()

  // Quick stats. Authentication is enforced by AdminShell.
  const [{ count: pendingCount }, { count: eventsCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('starts_at', new Date().toISOString()),
  ])

  return (
    <AdminShell>
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Pending directory approvals"
            value={pendingCount ?? 0}
            href="/admin/directory"
          />
          <StatCard
            label="Upcoming events"
            value={eventsCount ?? 0}
            href="/admin/events"
          />
        </div>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-medium">Heads up — TOTP not yet enabled</p>
          <p className="mt-1">
            We&apos;re rolling out admin features in stages. Two-factor authentication
            (TOTP) will be added in the next update. For now, please use a strong,
            unique password and don&apos;t share your credentials.
          </p>
        </div>
      </div>
    </AdminShell>
  )
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 hover:shadow-sm transition"
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
    </a>
  )
}
