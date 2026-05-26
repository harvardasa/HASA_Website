import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSessionFromRequest } from '@/lib/admin/auth';
import { getAdminServerContentAdapter } from '@/lib/admin/serverAdapter';
import { validateEventInput } from '@/lib/admin/validation';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const adapter = getAdminServerContentAdapter();
  const events = await adapter.listEvents();
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const validated = validateEventInput(body || {});

  if (!validated.ok) {
    return NextResponse.json({ errors: validated.errors }, { status: 400 });
  }

  const adapter = getAdminServerContentAdapter();
  const event = await adapter.upsertEvent(validated.data);
  return NextResponse.json({ event });
}
