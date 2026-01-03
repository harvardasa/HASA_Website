'use client';

import { useState } from 'react';

interface FeaturedEvent {
  id: string;
  title: string;
  date: string;
  summary: string;
  description: string;
  image: string;
  tags?: string[];
}

interface FeaturedEventsSectionProps {
  events: FeaturedEvent[];
}

export default function FeaturedEventsSection({ events }: FeaturedEventsSectionProps) {
  return (
    <section className="mb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 [perspective:1000px]">
        {events.map((event) => (
          <FeaturedEventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function FeaturedEventCard({ event }: { event: FeaturedEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const date = new Date(event.date);
  const isPast = date < new Date();

  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div 
      className="group relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out transform hover:[transform:rotateX(2deg)_translateY(-4px)] overflow-hidden flex flex-col"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />

      {/* Image Placeholder */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {/* In a real app, use Next.js Image. Using a div with background for now as requested placeholders might not exist */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
           {/* Placeholder visual */}
           <svg className="w-12 h-12 opacity-20" fill="currentColor" viewBox="0 0 24 24">
             <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
        {/* If we had real images, we'd render them here. For now, just a colored overlay based on ID hash or similar to distinguish? Or just the gray placeholder. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
           <div className="flex gap-2">
             {event.tags?.map(tag => (
               <span key={tag} className="px-2 py-1 text-xs font-medium bg-white/20 text-white backdrop-blur-md rounded-full border border-white/10">
                 {tag}
               </span>
             ))}
           </div>
           {isPast && (
             <span className="px-2 py-1 text-xs font-bold bg-gray-800/80 text-white backdrop-blur-md rounded-md border border-gray-700">
               Past
             </span>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-grow flex flex-col relative z-10">
        <div className="mb-4">
          <time dateTime={event.date} className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            {formattedDate}
          </time>
          <h3 className="text-2xl font-bold text-gray-900 mt-1 leading-tight group-hover:text-indigo-700 transition-colors">
            {event.title}
          </h3>
        </div>

        <div className="text-gray-600 mb-4 flex-grow">
          <p className="leading-relaxed">
            {isExpanded ? event.description : event.summary}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`desc-${event.id}`}
            className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors flex items-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 -ml-1"
          >
            {isExpanded ? 'Show less' : 'Read more'}
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
