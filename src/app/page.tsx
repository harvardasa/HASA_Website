import Link from 'next/link';
import { getEvents } from '@/lib/api';
import EventCard from '@/components/EventCard';

export default async function Home() {
  const events = await getEvents();
  const upcomingEvents = events
    .filter((e) => e.category === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-red-900 text-white py-32">
        <div className="absolute inset-0 overflow-hidden">
          {/* Placeholder for hero background image */}
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Harvard African Students Association
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-gray-200">
            A home away from home. Celebrating the diversity and richness of African cultures.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/events"
              className="bg-white text-red-900 px-8 py-3 rounded-md font-bold hover:bg-gray-100 transition-colors"
            >
              Upcoming Events
            </Link>
            <Link
              href="/leadership"
              className="border-2 border-white text-white px-8 py-3 rounded-md font-bold hover:bg-white hover:text-red-900 transition-colors"
            >
              Meet the Board
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who We Are</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              HASA is dedicated to building a community for African students at Harvard and anyone interested in the continent. 
              We organize cultural, social, and intellectual events to foster understanding and celebration of Africa's heritage.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
              <p className="text-gray-600 mt-2">Join us at our next gathering</p>
            </div>
            <Link href="/events" className="text-red-800 font-semibold hover:text-red-900">
              View all events &rarr;
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No upcoming events scheduled at the moment. Check back soon!</p>
          )}
        </div>
      </section>
    </div>
  );
}
