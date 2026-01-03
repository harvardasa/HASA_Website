import { getLeaders } from '@/lib/api';
import LeaderCard from '@/components/LeaderCard';

export const metadata = {
  title: 'Leadership - HASA',
  description: 'Meet the HASA Executive Board',
};

export default async function LeadershipPage() {
  const leaders = await getLeaders();

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Leadership</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Meet the dedicated team working to bring the HASA community together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leaders.map((leader) => (
            <LeaderCard key={leader.id} leader={leader} />
          ))}
        </div>
      </div>
    </div>
  );
}
