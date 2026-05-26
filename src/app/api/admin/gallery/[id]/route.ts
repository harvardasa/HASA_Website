import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSessionFromRequest } from '@/lib/admin/auth';
import { getAdminServerContentAdapter } from '@/lib/admin/serverAdapter';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  const adapter = getAdminServerContentAdapter();
  await adapter.deleteGalleryEvent(id);

  return NextResponse.json({ ok: true });
}
