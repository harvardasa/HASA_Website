import fs from 'fs/promises';
import path from 'path';
import { Leader, Event, GalleryItem } from '@/types';

const contentDirectory = path.join(process.cwd(), 'content');

export async function getLeaders(): Promise<Leader[]> {
  const filePath = path.join(contentDirectory, 'leaders.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  const leaders = data.leaders || data;
  
  return leaders.map((leader: any) => ({
    ...leader,
    image: leader.photo || leader.image,
    linkedin: leader.social?.linkedin,
    email: leader.email // email is top level in json
  }));
}

export async function getEvents(): Promise<Event[]> {
  const filePath = path.join(contentDirectory, 'events.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  const events = data.events || data;

  return events.map((event: any) => {
    const startDate = new Date(event.start);
    const isUpcoming = startDate > new Date();
    
    return {
      ...event,
      date: event.start,
      category: isUpcoming ? 'upcoming' : 'past',
      originalCategory: event.category // Keep the original category (social, etc) if needed
    };
  });
}

export async function getGallery(): Promise<GalleryItem[]> {
  const filePath = path.join(contentDirectory, 'gallery.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  const gallery = data.gallery || data;

  return gallery.map((item: any) => ({
    ...item,
    image: item.src || item.image,
    title: item.alt || item.title,
  }));
}

export async function getFeaturedEvents() {
  const filePath = path.join(contentDirectory, 'events.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  const events = data.events || data;
  return events.filter((e: any) => e.featured === true).map((e: any) => ({
    ...e,
    date: e.start.split('T')[0] // Format for featured component
  }));
}
