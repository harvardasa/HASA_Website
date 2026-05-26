import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('approval_status')
          .eq('id', user.id)
          .maybeSingle()

        // Update last_signed_in_at — no-op if profile doesn't exist yet
        if (profile) {
          await supabase
            .from('profiles')
            .update({ last_signed_in_at: new Date().toISOString() })
            .eq('id', user.id)
        }

        if (!profile) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
        if (profile.approval_status === 'pending' || profile.approval_status === 'rejected') {
          return NextResponse.redirect(`${origin}/pending`)
        }
        return NextResponse.redirect(`${origin}/directory`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
