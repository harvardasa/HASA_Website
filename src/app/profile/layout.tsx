import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DirectoryNav from '@/components/DirectoryNav'

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('approval_status, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding')
  if (profile.approval_status !== 'approved') redirect('/pending')

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <DirectoryNav isAdmin={profile.role === 'admin'} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
