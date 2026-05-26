import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSessionFromRequest } from '@/lib/admin/auth';
import { getAdminServerContentAdapter } from '@/lib/admin/serverAdapter';
import {
  validateGalleryUploadInput,
  validateImageFile,
} from '@/lib/admin/validation';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const adapter = getAdminServerContentAdapter();
  const items = await adapter.listGallery();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  if (!hasAdminSessionFromRequest(request)) {
    return unauthorized();
  }

  const formData = await request.formData();
  const rawFiles = formData
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File);

  if (rawFiles.length === 0) {
    return NextResponse.json({ errors: ['At least one image file is required.'] }, { status: 400 });
  }

  const validatedFiles: File[] = [];
  for (const file of rawFiles) {
    const fileValidation = validateImageFile(file);
    if (!fileValidation.ok) {
      return NextResponse.json({ errors: fileValidation.errors }, { status: 400 });
    }
    validatedFiles.push(fileValidation.data);
  }

  const metadataValidation = validateGalleryUploadInput({
    eventName: String(formData.get('eventName') || ''),
    date: String(formData.get('date') || ''),
    status: String(formData.get('status') || 'published') as
      | 'draft'
      | 'published',
  });

  if (!metadataValidation.ok) {
    return NextResponse.json(
      { errors: metadataValidation.errors },
      { status: 400 }
    );
  }

  const adapter = getAdminServerContentAdapter();
  const item = await adapter.uploadGalleryEvent({
    files: validatedFiles,
    ...metadataValidation.data,
  });

  return NextResponse.json({ item });
}
