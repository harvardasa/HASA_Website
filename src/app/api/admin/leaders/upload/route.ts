import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSessionFromRequest } from '@/lib/admin/auth';
import { getAdminServerContentAdapter } from '@/lib/admin/serverAdapter';
import { validateImageFile } from '@/lib/admin/validation';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const formData = await request.formData();
  const maybeFile = formData.get('file');
  const title = String(formData.get('title') || 'leader-photo');

  if (!(maybeFile instanceof File)) {
    return NextResponse.json({ errors: ['Image file is required.'] }, { status: 400 });
  }

  const fileValidation = validateImageFile(maybeFile);
  if (!fileValidation.ok) {
    return NextResponse.json({ errors: fileValidation.errors }, { status: 400 });
  }

  const adapter = getAdminServerContentAdapter();
  const upload = await adapter.uploadLeaderPhoto({
    file: fileValidation.data,
    title,
  });

  return NextResponse.json(upload);
}
