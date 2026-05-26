import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/admin/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/constants';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const adminKey = typeof body?.adminKey === 'string' ? body.adminKey : '';

  if (!validateAdminKey(adminKey)) {
    return NextResponse.json(
      { error: 'Invalid admin credentials.' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: 'authorized',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
