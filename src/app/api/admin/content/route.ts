import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSessionFromRequest } from '@/lib/admin/auth';
import { getAdminServerContentAdapter } from '@/lib/admin/serverAdapter';
import { validateSiteContentInput } from '@/lib/admin/validation';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const adapter = getAdminServerContentAdapter();
  const content = await adapter.getSiteContent();
  return NextResponse.json({ content });
}

export async function PUT(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const validation = validateSiteContentInput(body || {});

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const adapter = getAdminServerContentAdapter();
  const content = await adapter.updateSiteContent(validation.data);

  return NextResponse.json({ content });
}
