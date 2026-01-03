import { getEvents, getFeaturedEvents } from '@/lib/api';
import EventCard from '@/components/EventCard';
import FeaturedEventsSection from '@/components/FeaturedEventsSection';

export const metadata = {
  title: 'Events - HASA',
  description: 'Upcoming and past events hosted by HASA',
};

export default async function EventsPage() {
  const events = await getEvents();
  const featuredEvents = await getFeaturedEvents();
  
  const upcomingEvents = events
    .filter((e) => e.category === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const pastEvents = events
    .filter((e) => e.category === 'past')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Events</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            From cultural showcases to moments of service and community, our events bring the African diaspora together at Harvard throughout the year.
          </p>
        </div>

        <FeaturedEventsSection events={featuredEvents} />

        {upcomingEvents.length > 0 ? (
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-white mb-8 border-b border-hasa-red/50 pb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ) : (
           <div className="mb-20">
            <h2 className="text-2xl font-bold text-white mb-8 border-b border-hasa-red/50 pb-4">Upcoming Events</h2>
            <p className="text-gray-400 italic">No upcoming events posted yet—check back soon.</p>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Past Events</h2>
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No past events to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}
