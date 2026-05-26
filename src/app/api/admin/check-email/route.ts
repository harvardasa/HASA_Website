// POST /api/admin/check-email
// Body: { email: string }
// Response: { allowed: boolean }
//
// Called by the admin login page BEFORE any password is entered. If the email
// isn't on the allowlist we never even attempt authentication, so we don't
// leak whether the email exists in Supabase.

import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin-auth'

export async function POST(request: Request) {
  let email = ''
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email : ''
  } catch {
    return NextResponse.json({ allowed: false }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ allowed: false }, { status: 400 })
  }

  return NextResponse.json({ allowed: isAdminEmail(email) })
}
