export interface Leader {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  email?: string;
  linkedin?: string;
  imagePosition?: string;
  imageFit?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  category: 'upcoming' | 'past';
  image?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  album: string;
  date: string;
}
