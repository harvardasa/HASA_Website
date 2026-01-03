import { getLeaders } from '@/lib/api';
import LeaderCard from '@/components/LeaderCard';
import LeadershipHero from '@/components/LeadershipHero';

export const metadata = {
  title: 'Leadership - HASA',
  description: 'Meet the HASA Executive Board',
};

export default async function LeadershipPage() {
  const leaders = await getLeaders();

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background Image */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url(/images/leadership/leadership-hero.jpg)',
          }}
        />
        {/* Dark overlay for readability across the whole page */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <LeadershipHero />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leaders.map((leader) => (
              <LeaderCard key={leader.id} leader={leader} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
