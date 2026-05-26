import {
  EventContentRecord,
  GalleryContentRecord,
  Leader,
  SiteEditableContent,
  UploadMetadata,
} from '@/types';

export interface GalleryEventUploadInput {
  files: File[];
  eventName: string;
  date: string;
  status: 'draft' | 'published';
}

export interface EventPosterUploadInput {
  file: File;
  title: string;
}

export interface EventPosterUploadResult {
  image: string;
  metadata: UploadMetadata;
}

export interface AdminContentService {
  login(adminKey: string): Promise<void>;
  logout(): Promise<void>;
  listEvents(): Promise<EventContentRecord[]>;
  saveEvent(event: EventContentRecord): Promise<EventContentRecord>;
  deleteEvent(id: string): Promise<void>;
  uploadEventPoster(input: EventPosterUploadInput): Promise<EventPosterUploadResult>;
  uploadLeaderPhoto(input: EventPosterUploadInput): Promise<EventPosterUploadResult>;
  listGallery(): Promise<GalleryContentRecord[]>;
  uploadGalleryEvent(input: GalleryEventUploadInput): Promise<GalleryContentRecord>;
  deleteGalleryEvent(id: string): Promise<void>;
  getSiteContent(): Promise<SiteEditableContent>;
  updateSiteContent(content: SiteEditableContent): Promise<SiteEditableContent>;
  listLeaders(): Promise<Leader[]>;
  saveLeader(leader: Leader): Promise<Leader>;
  deleteLeader(id: string): Promise<void>;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed.';
    try {
      const data = await response.json();
      message = data?.error || data?.errors?.join(', ') || message;
    } catch {
      // Ignore JSON parse error.
    }
    throw new Error(message);
  }

  return response.json();
}

class ApiAdminContentService implements AdminContentService {
  async login(adminKey: string) {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey }),
    });
    await parseResponse<{ ok: true }>(response);
  }

  async logout() {
    const response = await fetch('/api/admin/auth/logout', {
      method: 'POST',
    });
    await parseResponse<{ ok: true }>(response);
  }

  async listEvents() {
    const response = await fetch('/api/admin/events', { cache: 'no-store' });
    const data = await parseResponse<{ events: EventContentRecord[] }>(response);
    return data.events;
  }

  async saveEvent(event: EventContentRecord) {
    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    const data = await parseResponse<{ event: EventContentRecord }>(response);
    return data.event;
  }

  async deleteEvent(id: string) {
    const response = await fetch(`/api/admin/events/${id}`, {
      method: 'DELETE',
    });
    await parseResponse<{ ok: true }>(response);
  }

  async uploadEventPoster(input: EventPosterUploadInput) {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('title', input.title);

    const response = await fetch('/api/admin/events/upload', {
      method: 'POST',
      body: formData,
    });

    return parseResponse<EventPosterUploadResult>(response);
  }

  async uploadLeaderPhoto(input: EventPosterUploadInput) {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('title', input.title);

    const response = await fetch('/api/admin/leaders/upload', {
      method: 'POST',
      body: formData,
    });

    return parseResponse<EventPosterUploadResult>(response);
  }

  async listGallery() {
    const response = await fetch('/api/admin/gallery', { cache: 'no-store' });
    const data = await parseResponse<{ items: GalleryContentRecord[] }>(response);
    return data.items;
  }

  async uploadGalleryEvent(input: GalleryEventUploadInput) {
    const formData = new FormData();
    for (const file of input.files) {
      formData.append('files', file);
    }
    formData.append('eventName', input.eventName);
    formData.append('date', input.date);
    formData.append('status', input.status);

    const response = await fetch('/api/admin/gallery', {
      method: 'POST',
      body: formData,
    });

    const data = await parseResponse<{ item: GalleryContentRecord }>(response);
    return data.item;
  }

  async deleteGalleryEvent(id: string) {
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
    });
    await parseResponse<{ ok: true }>(response);
  }

  async getSiteContent() {
    const response = await fetch('/api/admin/content', { cache: 'no-store' });
    const data = await parseResponse<{ content: SiteEditableContent }>(response);
    return data.content;
  }

  async updateSiteContent(content: SiteEditableContent) {
    const response = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });

    const data = await parseResponse<{ content: SiteEditableContent }>(response);
    return data.content;
  }

  async listLeaders() {
    const response = await fetch('/api/admin/leaders', { cache: 'no-store' });
    const data = await parseResponse<{ leaders: Leader[] }>(response);
    return data.leaders;
  }

  async saveLeader(leader: Leader) {
    const response = await fetch('/api/admin/leaders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leader),
    });

    const data = await parseResponse<{ leader: Leader }>(response);
    return data.leader;
  }

  async deleteLeader(id: string) {
    const response = await fetch(`/api/admin/leaders/${id}`, {
      method: 'DELETE',
    });

    await parseResponse<{ ok: true }>(response);
  }
}

export class MockAdminContentService implements AdminContentService {
  private events: EventContentRecord[] = [];
  private gallery: GalleryContentRecord[] = [];
  private siteContent: SiteEditableContent = {
    eventsIntro: 'Mock events intro',
    galleryIntro: 'Mock gallery intro',
    leadershipCurrentYear: 'AY 26-27',
    storyIntro: 'Mock story intro',
    storyMissionTitle: 'Mock mission title',
    storyMissionBody: 'Mock mission body',
    storyActivitiesTitle: 'Mock activities title',
    storyActivitiesIntro: 'Mock activities intro',
    storyActivities: ['Mock activity'],
  };
  private leaders: Leader[] = [];

  async login() {}
  async logout() {}

  async listEvents() {
    return this.events;
  }

  async saveEvent(event: EventContentRecord) {
    const index = this.events.findIndex((entry) => entry.id === event.id);
    if (index >= 0) {
      this.events[index] = event;
    } else {
      this.events.push(event);
    }
    return event;
  }

  async deleteEvent(id: string) {
    this.events = this.events.filter((entry) => entry.id !== id);
  }

  async uploadEventPoster(input: EventPosterUploadInput) {
    return {
      image: URL.createObjectURL(input.file),
      metadata: {
        originalName: input.file.name,
        mimeType: input.file.type,
        sizeBytes: input.file.size,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  async uploadLeaderPhoto(input: EventPosterUploadInput) {
    return {
      image: URL.createObjectURL(input.file),
      metadata: {
        originalName: input.file.name,
        mimeType: input.file.type,
        sizeBytes: input.file.size,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  async listGallery() {
    return this.gallery;
  }

  async uploadGalleryEvent(input: GalleryEventUploadInput) {
    const item: GalleryContentRecord = {
      id: `mock-${Date.now()}`,
      eventName: input.eventName,
      date: input.date,
      status: input.status,
      images: input.files.map((file, index) => ({
        id: `mock-${Date.now()}-${index}`,
        src: URL.createObjectURL(file),
      })),
    };
    this.gallery.unshift(item);
    return item;
  }

  async deleteGalleryEvent(id: string) {
    this.gallery = this.gallery.filter((entry) => entry.id !== id);
  }

  async getSiteContent() {
    return this.siteContent;
  }

  async updateSiteContent(content: SiteEditableContent) {
    this.siteContent = content;
    return content;
  }

  async listLeaders() {
    return this.leaders;
  }

  async saveLeader(leader: Leader) {
    const index = this.leaders.findIndex((entry) => entry.id === leader.id);
    if (index >= 0) {
      this.leaders[index] = leader;
    } else {
      this.leaders.push(leader);
    }
    return leader;
  }

  async deleteLeader(id: string) {
    this.leaders = this.leaders.filter((entry) => entry.id !== id);
  }
}

let singleton: AdminContentService | null = null;

export function getAdminContentService(): AdminContentService {
  if (!singleton) {
    singleton =
      process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_SERVICE === 'true'
        ? new MockAdminContentService()
        : new ApiAdminContentService();
  }
  return singleton;
}
