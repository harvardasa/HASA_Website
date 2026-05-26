import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from './constants';
import {
  EventContentRecord,
  GalleryContentRecord,
  Leader,
  SiteEditableContent,
} from '@/types';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function validateEventInput(
  input: Partial<EventContentRecord>
): ValidationResult<EventContentRecord> {
  const errors: string[] = [];

  if (!hasText(input.id)) errors.push('Event id is required.');
  if (!hasText(input.title)) errors.push('Title is required.');
  if (!hasText(input.start)) errors.push('Start date/time is required.');
  if (!hasText(input.end)) errors.push('End date/time is required.');
  if (!hasText(input.location)) errors.push('Location is required.');
  if (!hasText(input.image)) errors.push('Image path is required.');
  if (!hasText(input.summary)) errors.push('Summary is required.');
  if (!hasText(input.description)) errors.push('Description is required.');

  const startDate = input.start ? new Date(input.start) : null;
  const endDate = input.end ? new Date(input.end) : null;
  if (startDate && Number.isNaN(startDate.getTime())) {
    errors.push('Start date/time is invalid.');
  }
  if (endDate && Number.isNaN(endDate.getTime())) {
    errors.push('End date/time is invalid.');
  }
  if (
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate < startDate
  ) {
    errors.push('End date/time must be after start date/time.');
  }

  const status = input.status || 'published';
  if (status !== 'draft' && status !== 'published') {
    errors.push('Status must be draft or published.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      id: input.id!.trim(),
      title: input.title!.trim(),
      start: input.start!,
      end: input.end!,
      location: input.location!.trim(),
      image: input.image!.trim(),
      summary: input.summary!.trim(),
      description: input.description!.trim(),
      status,
    },
  };
}

export function validateGalleryUploadInput(
  input: Partial<GalleryContentRecord>
): ValidationResult<
  Pick<GalleryContentRecord, 'eventName' | 'date' | 'status'>
> {
  const errors: string[] = [];

  if (!hasText(input.eventName)) errors.push('Event name is required.');
  if (!hasText(input.date)) errors.push('Date is required.');

  const parsedDate = input.date ? new Date(input.date) : null;
  if (parsedDate && Number.isNaN(parsedDate.getTime())) {
    errors.push('Date is invalid.');
  }

  const status = input.status || 'published';
  if (status !== 'draft' && status !== 'published') {
    errors.push('Status must be draft or published.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      eventName: input.eventName!.trim(),
      date: input.date!,
      status,
    },
  };
}

export function validateImageFile(file: File): ValidationResult<File> {
  const errors: string[] = [];

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    errors.push('Only JPG, PNG, and WEBP images are allowed.');
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    errors.push('Image must be 5MB or smaller.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: file };
}

export function validateSiteContentInput(
  input: Partial<SiteEditableContent>
): ValidationResult<SiteEditableContent> {
  const errors: string[] = [];
  const storyActivities = normalizeStringList(input.storyActivities);

  if (!hasText(input.eventsIntro)) errors.push('Events intro cannot be empty.');
  if (!hasText(input.galleryIntro)) errors.push('Gallery intro cannot be empty.');
  if (!hasText(input.leadershipCurrentYear)) {
    errors.push('Current leadership year cannot be empty.');
  }
  if (!hasText(input.storyIntro)) errors.push('Story intro cannot be empty.');
  if (!hasText(input.storyMissionTitle)) {
    errors.push('Story mission title cannot be empty.');
  }
  if (!hasText(input.storyMissionBody)) {
    errors.push('Story mission body cannot be empty.');
  }
  if (!hasText(input.storyActivitiesTitle)) {
    errors.push('Story activities title cannot be empty.');
  }
  if (!hasText(input.storyActivitiesIntro)) {
    errors.push('Story activities intro cannot be empty.');
  }
  if (storyActivities.length === 0) {
    errors.push('Add at least one story activity.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      eventsIntro: input.eventsIntro!.trim(),
      galleryIntro: input.galleryIntro!.trim(),
      leadershipCurrentYear: input.leadershipCurrentYear!.trim(),
      storyIntro: input.storyIntro!.trim(),
      storyMissionTitle: input.storyMissionTitle!.trim(),
      storyMissionBody: input.storyMissionBody!.trim(),
      storyActivitiesTitle: input.storyActivitiesTitle!.trim(),
      storyActivitiesIntro: input.storyActivitiesIntro!.trim(),
      storyActivities,
    },
  };
}

export function validateLeaderInput(
  input: Partial<Leader>
): ValidationResult<Leader> {
  const errors: string[] = [];
  const responsibilities = normalizeStringList(input.responsibilities);

  if (!hasText(input.id)) errors.push('Leader id is required.');
  if (!hasText(input.academicYear)) errors.push('Academic year is required.');
  if (!hasText(input.name)) errors.push('Leader name is required.');
  if (!hasText(input.role)) errors.push('Leader role is required.');
  if (!hasText(input.bio)) errors.push('Leader bio is required.');
  if (!hasText(input.image) && !hasText(input.photo)) {
    errors.push('Leader image is required.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const image = hasText(input.image) ? input.image!.trim() : input.photo!.trim();
  const linkedin = hasText(input.linkedin)
    ? input.linkedin!.trim()
    : hasText(input.social?.linkedin)
      ? input.social!.linkedin!.trim()
      : undefined;

  return {
    ok: true,
    data: {
      id: input.id!.trim(),
      academicYear: input.academicYear!.trim(),
      name: input.name!.trim(),
      role: input.role!.trim(),
      bio: input.bio!.trim(),
      image,
      photo: image,
      email: hasText(input.email) ? input.email!.trim() : undefined,
      linkedin,
      social: linkedin ? { ...input.social, linkedin } : input.social,
      imagePosition: hasText(input.imagePosition) ? input.imagePosition!.trim() : undefined,
      imageFit: hasText(input.imageFit) ? input.imageFit!.trim() : undefined,
      blurb: hasText(input.blurb) ? input.blurb!.trim() : undefined,
      majorYear: hasText(input.majorYear) ? input.majorYear!.trim() : undefined,
      responsibilities,
      funFact: hasText(input.funFact) ? input.funFact!.trim() : undefined,
      order: typeof input.order === 'number' ? input.order : undefined,
      status:
        input.status === 'draft' || input.status === 'published'
          ? input.status
          : 'published',
    },
  };
}
