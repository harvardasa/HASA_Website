import fs from 'fs/promises';
import path from 'path';
import {
  EventContentRecord,
  GalleryContentRecord,
  GalleryImageRecord,
  Leader,
  SiteEditableContent,
  UploadMetadata,
} from '@/types';

const contentDir = path.join(process.cwd(), 'content');
const publicDir = path.join(process.cwd(), 'public');
const galleryDir = path.join(publicDir, 'images', 'gallery');
const eventPosterDir = path.join(publicDir, 'images', 'events');
const leaderPhotoDir = path.join(publicDir, 'images', 'leaders');

const defaultSiteContent: SiteEditableContent = {
  eventsIntro:
    'From cultural showcases to moments of service and community, our events bring the African diaspora together at Harvard throughout the year.',
  galleryIntro: 'Capturing moments from our community.',
  leadershipCurrentYear: 'AY 26-27',
  storyIntro:
    'The Harvard African Students Association (HASA) was founded with the mission of creating a supportive community for African students at Harvard University. Over the years, we have grown into a vibrant organization that celebrates the rich diversity of the African continent.',
  storyMissionTitle: 'Our Mission',
  storyMissionBody:
    'Our mission is to foster a sense of belonging for African students, to promote awareness of African issues and culture within the Harvard community, and to provide a platform for intellectual engagement with the continent.',
  storyActivitiesTitle: 'What We Do',
  storyActivitiesIntro:
    'We organize a wide range of events throughout the academic year, including:',
  storyActivities: [
    'Cultural showcases and performances',
    'Academic panels and discussions',
    'Social gatherings and networking events',
    'Community service initiatives',
  ],
};

export interface AdminServerContentAdapter {
  listEvents(): Promise<EventContentRecord[]>;
  upsertEvent(event: EventContentRecord): Promise<EventContentRecord>;
  deleteEvent(id: string): Promise<void>;
  uploadEventPoster(params: { file: File; title: string }): Promise<{
    image: string;
    metadata: UploadMetadata;
  }>;
  uploadLeaderPhoto(params: { file: File; title: string }): Promise<{
    image: string;
    metadata: UploadMetadata;
  }>;
  listGallery(): Promise<GalleryContentRecord[]>;
  uploadGalleryEvent(params: {
    files: File[];
    eventName: string;
    date: string;
    status: 'draft' | 'published';
  }): Promise<GalleryContentRecord>;
  deleteGalleryEvent(id: string): Promise<void>;
  getSiteContent(): Promise<SiteEditableContent>;
  updateSiteContent(content: SiteEditableContent): Promise<SiteEditableContent>;
  listLeaders(): Promise<Leader[]>;
  upsertLeader(leader: Leader): Promise<Leader>;
  deleteLeader(id: string): Promise<void>;
}

function sanitizeForFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 48);
}

async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = path.join(contentDir, fileName);
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(fileName: string, data: unknown) {
  const filePath = path.join(contentDir, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function ensureGalleryDirectory() {
  await fs.mkdir(galleryDir, { recursive: true });
}

async function ensureEventPosterDirectory() {
  await fs.mkdir(eventPosterDir, { recursive: true });
}

async function ensureLeaderPhotoDirectory() {
  await fs.mkdir(leaderPhotoDir, { recursive: true });
}

async function readEvents(): Promise<EventContentRecord[]> {
  const data = await readJsonFile<Partial<EventContentRecord>[]>('events.json', []);
  return Array.isArray(data)
    ? data.map((event) => ({
        id: String(event.id || ''),
        title: String(event.title || ''),
        start: String(event.start || ''),
        end: String(event.end || ''),
        location: String(event.location || ''),
        image: String(event.image || ''),
        summary: String(event.summary || ''),
        description: String(event.description || ''),
        status: event.status === 'draft' ? 'draft' : 'published',
      }))
    : [];
}

async function readGallery(): Promise<GalleryContentRecord[]> {
  const data = await readJsonFile<Partial<GalleryContentRecord>[]>('gallery.json', []);
  return Array.isArray(data)
    ? data.map((item) => ({
        id: String(item.id || ''),
        eventName:
          String(item.eventName || (item as unknown as { album?: string }).album || ''),
        date: String(item.date || ''),
        status: item.status === 'draft' ? 'draft' : 'published',
        images: Array.isArray(item.images)
          ? item.images
              .map((image) => ({
                id: String(image.id || ''),
                src: String(image.src || ''),
                metadata: image.metadata,
              }))
              .filter((image) => image.src)
          : (() => {
              const legacySrc = (item as unknown as { src?: string }).src;
              const legacyMetadata =
                (item as unknown as { metadata?: UploadMetadata }).metadata;
              if (!legacySrc || typeof legacySrc !== 'string') {
                return [];
              }

              return [
                {
                  id: `${String(item.id || 'gallery')}-legacy`,
                  src: legacySrc,
                  metadata: legacyMetadata,
                },
              ];
            })(),
      }))
    : [];
}

async function readLeaders(): Promise<Leader[]> {
  const data = await readJsonFile<Partial<Leader>[]>('leaders.json', []);
  return Array.isArray(data)
    ? data.map((leader) => {
        const image = String(leader.image || leader.photo || '');
        const linkedin =
          typeof leader.linkedin === 'string'
            ? leader.linkedin
            : typeof leader.social?.linkedin === 'string'
              ? leader.social.linkedin
              : undefined;

        return {
          id: String(leader.id || ''),
          academicYear:
            typeof leader.academicYear === 'string' ? leader.academicYear : 'AY 25-26',
          name: String(leader.name || ''),
          role: String(leader.role || ''),
          bio: String(leader.bio || ''),
          image,
          photo: image,
          email: typeof leader.email === 'string' ? leader.email : undefined,
          linkedin,
          social: leader.social,
          imagePosition:
            typeof leader.imagePosition === 'string' ? leader.imagePosition : undefined,
          imageFit: typeof leader.imageFit === 'string' ? leader.imageFit : undefined,
          blurb: typeof leader.blurb === 'string' ? leader.blurb : undefined,
          majorYear: typeof leader.majorYear === 'string' ? leader.majorYear : undefined,
          responsibilities: Array.isArray(leader.responsibilities)
            ? leader.responsibilities.filter(
                (item): item is string => typeof item === 'string'
              )
            : [],
          funFact: typeof leader.funFact === 'string' ? leader.funFact : undefined,
          order: typeof leader.order === 'number' ? leader.order : undefined,
          status: leader.status === 'draft' ? 'draft' : 'published',
        };
      })
    : [];
}

function sortEventsForStorage(events: EventContentRecord[]) {
  return [...events].sort(
    (a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime() ||
      a.id.localeCompare(b.id)
  );
}

function sortGalleryForStorage(items: GalleryContentRecord[]) {
  return [...items].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)
  );
}

function sortLeadersForStorage(leaders: Leader[]) {
  return [...leaders].sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
  );
}

class FileAdminContentAdapter implements AdminServerContentAdapter {
  async listEvents() {
    const events = await readEvents();
    return sortEventsForStorage(events);
  }

  async upsertEvent(event: EventContentRecord) {
    const events = await readEvents();
    const index = events.findIndex((item) => item.id === event.id);

    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }

    const sorted = sortEventsForStorage(events);
    await writeJsonFile('events.json', sorted);
    return event;
  }

  async deleteEvent(id: string) {
    const events = await readEvents();
    const next = events.filter((item) => item.id !== id);
    await writeJsonFile('events.json', next);
  }

  async uploadEventPoster(params: { file: File; title: string }) {
    await ensureEventPosterDirectory();

    const ext = params.file.name.includes('.')
      ? params.file.name.slice(params.file.name.lastIndexOf('.')).toLowerCase()
      : '.jpg';
    const now = new Date();
    const baseId = `${sanitizeForFileName(params.title || 'event-poster')}-${now.getTime()}`;
    const fileName = `${baseId}${ext}`;
    const filePath = path.join(eventPosterDir, fileName);

    const arrayBuffer = await params.file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    return {
      image: `/images/events/${fileName}`,
      metadata: {
        originalName: params.file.name,
        mimeType: params.file.type,
        sizeBytes: params.file.size,
        uploadedAt: now.toISOString(),
      },
    };
  }

  async uploadLeaderPhoto(params: { file: File; title: string }) {
    await ensureLeaderPhotoDirectory();

    const ext = params.file.name.includes('.')
      ? params.file.name.slice(params.file.name.lastIndexOf('.')).toLowerCase()
      : '.jpg';
    const now = new Date();
    const baseId = `${sanitizeForFileName(params.title || 'leader-photo')}-${now.getTime()}`;
    const fileName = `${baseId}${ext}`;
    const filePath = path.join(leaderPhotoDir, fileName);

    const arrayBuffer = await params.file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    return {
      image: `/images/leaders/${fileName}`,
      metadata: {
        originalName: params.file.name,
        mimeType: params.file.type,
        sizeBytes: params.file.size,
        uploadedAt: now.toISOString(),
      },
    };
  }

  async listGallery() {
    const items = await readGallery();
    return sortGalleryForStorage(items);
  }

  async uploadGalleryEvent(params: {
    files: File[];
    eventName: string;
    date: string;
    status: 'draft' | 'published';
  }) {
    await ensureGalleryDirectory();

    const now = new Date();
    const eventId = `${sanitizeForFileName(params.eventName)}-${now.getTime()}`;
    const images: GalleryImageRecord[] = [];

    for (const file of params.files) {
      const ext = file.name.includes('.')
        ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
        : '.jpg';
      const imageId = `${eventId}-${images.length + 1}`;
      const fileName = `${imageId}${ext}`;
      const filePath = path.join(galleryDir, fileName);

      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));

      images.push({
        id: imageId,
        src: `/images/gallery/${fileName}`,
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedAt: now.toISOString(),
        },
      });
    }

    const newItem: GalleryContentRecord = {
      id: eventId,
      eventName: params.eventName,
      date: params.date,
      status: params.status,
      images,
    };

    const items = await readGallery();
    items.unshift(newItem);
    await writeJsonFile('gallery.json', sortGalleryForStorage(items));

    return newItem;
  }

  async deleteGalleryEvent(id: string) {
    const items = await readGallery();
    const item = items.find((entry) => entry.id === id);
    const next = items.filter((entry) => entry.id !== id);
    await writeJsonFile('gallery.json', next);

    if (item?.images?.length) {
      for (const image of item.images) {
        if (!image.src.startsWith('/images/gallery/')) {
          continue;
        }

        const localName = image.src.replace('/images/gallery/', '');
        const localPath = path.join(galleryDir, localName);
        try {
          await fs.unlink(localPath);
        } catch {
          // Ignore if file does not exist.
        }
      }
    }
  }

  async getSiteContent() {
    const data = await readJsonFile<SiteEditableContent>(
      'site-content.json',
      defaultSiteContent
    );

    return {
      eventsIntro: data.eventsIntro || defaultSiteContent.eventsIntro,
      galleryIntro: data.galleryIntro || defaultSiteContent.galleryIntro,
      leadershipCurrentYear:
        data.leadershipCurrentYear || defaultSiteContent.leadershipCurrentYear,
      storyIntro: data.storyIntro || defaultSiteContent.storyIntro,
      storyMissionTitle:
        data.storyMissionTitle || defaultSiteContent.storyMissionTitle,
      storyMissionBody: data.storyMissionBody || defaultSiteContent.storyMissionBody,
      storyActivitiesTitle:
        data.storyActivitiesTitle || defaultSiteContent.storyActivitiesTitle,
      storyActivitiesIntro:
        data.storyActivitiesIntro || defaultSiteContent.storyActivitiesIntro,
      storyActivities:
        Array.isArray(data.storyActivities) && data.storyActivities.length > 0
          ? data.storyActivities.filter(
              (item): item is string => typeof item === 'string' && item.trim().length > 0
            )
          : defaultSiteContent.storyActivities,
    };
  }

  async updateSiteContent(content: SiteEditableContent) {
    await writeJsonFile('site-content.json', content);
    return content;
  }

  async listLeaders() {
    const leaders = await readLeaders();
    return sortLeadersForStorage(leaders);
  }

  async upsertLeader(leader: Leader) {
    const leaders = await readLeaders();
    const index = leaders.findIndex((item) => item.id === leader.id);
    const nextLeader: Leader = {
      ...leader,
      academicYear: leader.academicYear || 'AY 25-26',
      image: leader.image || leader.photo || '',
      photo: leader.photo || leader.image || '',
      linkedin: leader.linkedin || leader.social?.linkedin,
      social: leader.linkedin || leader.social?.linkedin
        ? { ...leader.social, linkedin: leader.linkedin || leader.social?.linkedin }
        : leader.social,
      responsibilities: Array.isArray(leader.responsibilities)
        ? leader.responsibilities.filter((item): item is string => typeof item === 'string')
        : [],
      status: leader.status === 'draft' ? 'draft' : 'published',
      imagePosition: 'object-center',
      imageFit: 'object-cover',
    };

    if (index >= 0) {
      leaders[index] = nextLeader;
    } else {
      leaders.push(nextLeader);
    }

    const sorted = sortLeadersForStorage(leaders);
    await writeJsonFile('leaders.json', sorted);
    return nextLeader;
  }

  async deleteLeader(id: string) {
    const leaders = await readLeaders();
    const next = leaders.filter((item) => item.id !== id);
    await writeJsonFile('leaders.json', sortLeadersForStorage(next));
  }
}

let singleton: AdminServerContentAdapter | null = null;

export function getAdminServerContentAdapter(): AdminServerContentAdapter {
  if (!singleton) {
    singleton = new FileAdminContentAdapter();
  }
  return singleton;
}
