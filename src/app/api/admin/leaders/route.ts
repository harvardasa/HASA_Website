import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSessionFromRequest } from '@/lib/admin/auth';
import { getAdminServerContentAdapter } from '@/lib/admin/serverAdapter';
import { validateLeaderInput } from '@/lib/admin/validation';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const adapter = getAdminServerContentAdapter();
  const leaders = await adapter.listLeaders();
  return NextResponse.json({ leaders });
}

export async function POST(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const validation = validateLeaderInput(body || {});

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const adapter = getAdminServerContentAdapter();
  const leader = await adapter.upsertLeader(validation.data);
  return NextResponse.json({ leader });
}